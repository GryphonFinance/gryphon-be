import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true })
  defaultWallet?: string;

  @Prop()
  profileImageUrl?: string;

  @Prop()
  nonce?: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
