import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Stats extends Document{
    @Prop({ type: Types.ObjectId, ref: 'PreBondedAgent', required: true })
    preBondedAgent: Types.ObjectId;
    @Prop()
    priceInUsd: string;
    @Prop()
    marketCapInUsd: string;
    @Prop()
    liquidityInUsd: string;
    @Prop()
    volume1H: string;
    @Prop()
    volume24H: string;
    @Prop()
    volume7D: string;
    @Prop()
    tokensSoldInUsd: string;
    @Prop()
    graduationPercentage: string;   
    @Prop()
    graduationThresholdInUsd: string;
    @Prop()
    priceChange24H: string;
}

export const StatsSchema = SchemaFactory.createForClass(Stats);