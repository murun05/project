import { applyDecorators } from '@nestjs/common';
import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { IsBoolean, IsEmail, IsEnum, IsInt, IsMongoId, IsOptional, IsString, Length, Matches, Max, MaxLength, Min, MinLength } from 'class-validator';
import { BillingCycle, DocType, RecordType } from '../enums';

const text = (max = 200) => applyDecorators(Field(() => String, { nullable: true }), IsOptional(), IsString(), MaxLength(max));
const date = () => applyDecorators(Field(() => String, { nullable: true }), IsOptional(), Matches(/^(\d{4}-\d{2}-\d{2})?$/, { message: 'Use the format YYYY-MM-DD.' }));
const flag = () => applyDecorators(Field(() => Boolean, { nullable: true }), IsOptional(), IsBoolean());

@InputType()
export class RegisterInput {
  @Field() @IsEmail() email: string;
  @Field() @IsString() @MinLength(8) @MaxLength(72) password: string;
  @Field() @IsString() @Length(1, 60) displayName: string;
  @text(60) timezone?: string;
}

@InputType()
export class LoginInput {
  @Field() @IsEmail() email: string;
  @Field() @IsString() @MaxLength(72) password: string;
}

@InputType()
export class RecordFieldsInput {
  @text(120) title?: string;
  @text(2000) notes?: string;
  @text(120) merchant?: string;
  /** A decimal string such as "129000" or "2.99". Stored as integer minor units. */
  @Field(() => String, { nullable: true }) @IsOptional() @Matches(/^(\d{1,12}(\.\d+)?)?$/, { message: 'Amount must be a positive number.' }) amount?: string;
  @Field(() => String, { nullable: true }) @IsOptional() @Matches(/^([A-Z]{3})?$/, { message: 'Currency must be a 3-letter code such as KRW.' }) currency?: string;
  @date() purchaseDate?: string;
  @date() returnBy?: string;
  @date() warrantyEnd?: string;
  @text(60) category?: string;
  @text(120) location?: string;
  @text(80) serial?: string;
  @text(40) qty?: string;
  @date() expires?: string;
  @date() opened?: string;
  @Field(() => BillingCycle, { nullable: true }) @IsOptional() @IsEnum(BillingCycle) cycle?: BillingCycle;
  @date() renewal?: string;
  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() @Min(0) @Max(60) remindDays?: number;
  @flag() trial?: boolean;
  @date() trialEnd?: string;
  @flag() unused?: boolean;
  @Field(() => DocType, { nullable: true }) @IsOptional() @IsEnum(DocType) docType?: DocType;
  @date() dueDate?: string;
}

@InputType()
export class CreateRecordInput extends RecordFieldsInput {
  @Field(() => RecordType) @IsEnum(RecordType) type: RecordType;
  /** Optionally link the new record (for example a document or an errand) to an existing one. */
  @Field(() => ID, { nullable: true }) @IsOptional() @IsMongoId() linkToId?: string;
}

@InputType()
export class UpdateRecordInput extends RecordFieldsInput {
  @Field(() => ID) @IsMongoId() id: string;
}

@InputType()
export class PurchaseOptionsInput {
  @flag() trackInStuff?: boolean; // default true
  @flag() returnReminder?: boolean; // default true
  @flag() warrantyReminder?: boolean; // default true
  @flag() createReturnErrand?: boolean; // default false
  @text(120) receiptName?: string;
}

@InputType()
export class RecordsFilterInput {
  @Field(() => RecordType, { nullable: true }) @IsOptional() @IsEnum(RecordType) type?: RecordType;
  @text(60) search?: string;
  @flag() archived?: boolean;
}
