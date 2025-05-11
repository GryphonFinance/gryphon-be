import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';


@Schema({ timestamps: true })
export class PreBondedAgent extends Document {
    @Prop({ type: Types.ObjectId, ref: 'Agent', required: true })
    agent: Types.ObjectId;
    @Prop({ required: true })
    fName: string;
    @Prop({ type: String, required: true })
    supply: string;
    @Prop({ type: String, required: true })
    price: string;
    @Prop({ type: String, required: true })
    prevPrice: string;
    @Prop({ type: String, required: true })
    marketCap: string;
    @Prop({ type: String, required: true })
    liquidity: string;
    @Prop({ type: String, required: true })
    volume: string;
    @Prop({ type: String, required: true })
    volume24H: string;
}

export const PreBondedAgentSchema = SchemaFactory.createForClass(PreBondedAgent);

