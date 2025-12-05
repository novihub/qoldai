import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TicketService } from './ticket.service';
import { CreateTicketDto, UpdateTicketDto, CreateTicketMessageDto, TicketFilterDto } from './dto/ticket.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  // Create new ticket (any authenticated user)
  @Post()
  async create(@Request() req: any, @Body() dto: CreateTicketDto) {
    return this.ticketService.create(req.user.id, dto);
  }

  // Get user's own tickets
  @Get('my')
  async getMyTickets(@Request() req: any) {
    return this.ticketService.findMyTickets(req.user.id);
  }

  // Get all tickets (operators and admins only)
  @Get()
  @UseGuards(RolesGuard)
  @Roles('OPERATOR', 'ADMIN')
  async findAll(@Query() filters: TicketFilterDto) {
    return this.ticketService.findAll(filters);
  }

  // Get tickets assigned to current operator
  @Get('assigned')
  @UseGuards(RolesGuard)
  @Roles('OPERATOR', 'ADMIN')
  async getAssignedTickets(@Request() req: any) {
    return this.ticketService.findOperatorTickets(req.user.id);
  }

  // Get statistics (operators and admins only)
  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles('OPERATOR', 'ADMIN')
  async getStats() {
    return this.ticketService.getStats();
  }

  // Get timeline statistics (last 7 days)
  @Get('stats/timeline')
  @UseGuards(RolesGuard)
  @Roles('OPERATOR', 'ADMIN')
  async getTimeline() {
    return this.ticketService.getTimelineStats();
  }

  // Get single ticket
  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.ticketService.findOne(id, req.user.id, req.user.role);
  }

  // Update ticket
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTicketDto,
    @Request() req: any,
  ) {
    return this.ticketService.update(id, req.user.id, req.user.role, dto);
  }

  // Add message to ticket
  @Post(':id/messages')
  async addMessage(
    @Param('id') id: string,
    @Body() dto: CreateTicketMessageDto,
    @Request() req: any,
  ) {
    return this.ticketService.addMessage(id, req.user.id, req.user.role, dto);
  }

  // Get AI suggestion for response (operators only)
  @Get(':id/suggestion')
  @UseGuards(RolesGuard)
  @Roles('OPERATOR', 'ADMIN')
  async getSuggestion(@Param('id') id: string) {
    return this.ticketService.generateSuggestion(id);
  }

  // Summarize ticket (operators only)
  @Post(':id/summarize')
  @UseGuards(RolesGuard)
  @Roles('OPERATOR', 'ADMIN')
  async summarize(@Param('id') id: string) {
    return this.ticketService.summarize(id);
  }

  // Assign ticket to operator (admins only)
  @Put(':id/assign/:operatorId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async assignToOperator(
    @Param('id') id: string,
    @Param('operatorId') operatorId: string,
  ) {
    return this.ticketService.assignToOperator(id, operatorId);
  }

  // Self-assign ticket (operators)
  @Put(':id/take')
  @UseGuards(RolesGuard)
  @Roles('OPERATOR', 'ADMIN')
  async takeTicket(@Param('id') id: string, @Request() req: any) {
    return this.ticketService.assignToOperator(id, req.user.id);
  }
}
