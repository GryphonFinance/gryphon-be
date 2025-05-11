import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Agent extends Document {
    @Prop({ required: true })
    index: string;
    @Prop({ required: true })
    creator: string;
    @Prop({ required: true, unique: true })
    token: string;
    @Prop()
    bondingPair: string;
    @Prop()
    agentToken: string;
    @Prop()
    lpPair: string;
    @Prop({ required: true })
    name: string;
    @Prop({ required: true })
    ticker: string;
    @Prop({ required: true })
    description: string;
    @Prop({ required: true })
    image: string;
    @Prop()
    twitter: string;
    @Prop()
    telegram: string;
    @Prop()
    youtube: string;
    @Prop()
    website: string;
    @Prop({ required: true, default: true })
    trading: boolean;
    @Prop({ required: true, default: false })
    tradingOnUniswap: boolean;
    @Prop({ default: false })
    isGraduated: boolean;
}

export const AgentSchema = SchemaFactory.createForClass(Agent);

