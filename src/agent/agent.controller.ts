import { Controller, Get, Post, Body, Param, Delete, Patch, Put, Query } from '@nestjs/common';
import { AgentService } from './agent.service';
import { Public } from 'src/auth/decorators/public.decorator';
@Controller('agents')
export class AgentController {
    constructor(private readonly agentService: AgentService) {}

    @Post()
    createAgent(@Body('agentData') agentData: any) {
        return this.agentService.createAgent(agentData);
    }

    @Public()
    @Get('tokens')
    getAllAgentsTokens() {
        return this.agentService.getAllAgentsTokens();
    }

    @Public()
    @Get(':id')
    getAgent(@Param('id') id: string) {
        return this.agentService.getAgent(id);
    }

    @Public()
    @Get()
    getAllAgents() {
        return this.agentService.getAllAgents();
    }

    @Public()
    @Get('tokens/:token')
    getAgentByToken(@Param('token') token: string) {
        return this.agentService.getAgentByToken(token);
    }

    @Put(':token')
    updateAgent(@Param('token') token: string, @Body() body) {
        return this.agentService.updateAgent(token, body);
    }

    @Public()
    @Get(':id/ohlcv')
    getGraph(@Param('id') id: string, @Query('granularity') granularity: string, @Query('startTime') startTime: number, @Query('endTime') endTime: number) {
        return this.agentService.getGraph(id, granularity, startTime, endTime);
    }

}
