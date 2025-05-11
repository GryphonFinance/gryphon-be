import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class SocialProfile extends Document {
    @Prop({ type: Types.ObjectId, ref: 'User' })
    userId: Types.ObjectId;

    @Prop({ required: true })
    platform: string;

    @Prop({ required: true })
    platformUserId: string;

    @Prop()
    username: string;

    @Prop()
    verifiedAt: Date;
}

export const SocialProfileSchema = SchemaFactory.createForClass(SocialProfile);