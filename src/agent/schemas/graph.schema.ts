import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Graph extends Document {
    @Prop({ type: Types.ObjectId, ref: 'Agent', required: true })
    agent: Types.ObjectId;
    @Prop()
    open: string;
    @Prop()
    high: string;
    @Prop()
    low: string;
    @Prop()
    close: string;
    @Prop()
    volume: string;
    @Prop()
    startTimestamp: string;
    @Prop()
    endTimestamp: string;
    @Prop()
    totalTransactions: number;
    @Prop()
    buyTransactions: number;
    @Prop()
    sellTransactions: number;
    @Prop()
    buyVolume: string;
    @Prop()
    sellVolume: string;
}

export const GraphSchema = SchemaFactory.createForClass(Graph);
