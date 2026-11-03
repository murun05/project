import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { AuthGuard } from './components/auth/auth.guard';
import { AuthResolver } from './components/auth/auth.resolver';
import { AuthService } from './components/auth/auth.service';

// Checks the GraphQL server, auth guard and input validation work together. The database is replaced by a fake service.
describe('GraphQL wiring (no database)', () => {
  let app: INestApplication;
  let url: string;
  let token: string;
  const fakeAuth = {
    register: async (i: any) => ({ accessToken: 'token', member: { _id: '1', email: i.email, displayName: i.displayName, timezone: 'UTC' } }),
    me: async (id: string) => ({ _id: id, email: 'a@b.co', displayName: 'A', timezone: 'UTC' }),
  };

  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'test-secret' }), GraphQLModule.forRoot<ApolloDriverConfig>({ driver: ApolloDriver, autoSchemaFile: true, context: ({ req }: any) => ({ req }) })],
      providers: [AuthResolver, AuthGuard, { provide: AuthService, useValue: fakeAuth }],
    }).compile();
    app = mod.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.listen(0);
    url = `${await app.getUrl()}/graphql`;
    token = await mod.get(JwtService).signAsync({ sub: 'abc123', email: 'a@b.co' });
  });
  afterAll(async () => app.close());

  const post = async (query: string, headers: Record<string, string> = {}) => {
    const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify({ query }) });
    return res.json() as Promise<any>;
  };

  it('rejects requests without a token', async () => {
    const r = await post('{ me { email } }');
    expect(r.errors[0].message).toBe('Please sign in first.');
  });
  it('rejects a forged token', async () => {
    const r = await post('{ me { email } }', { authorization: 'Bearer not-a-real-token' });
    expect(r.errors[0].message).toBe('Please sign in first.');
  });
  it('returns the signed-in member for a valid token', async () => {
    const r = await post('{ me { _id email } }', { authorization: `Bearer ${token}` });
    expect(r.data.me._id).toBe('abc123');
  });
  it('validates registration input', async () => {
    const bad = await post('mutation { register(input: { email: "nope", password: "short", displayName: "A" }) { accessToken } }');
    expect(JSON.stringify(bad.errors)).toMatch(/email must be an email/);
    const ok = await post('mutation { register(input: { email: "a@b.co", password: "long-enough-1", displayName: "A" }) { accessToken member { email } } }');
    expect(ok.data.register.accessToken).toBe('token');
  });
});
