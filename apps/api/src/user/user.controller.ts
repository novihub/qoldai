import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private userService: UserService) {}

  @Get('me')
  getMe(@Req() req: any) {
    return this.userService.findById(req.user.id);
  }

  @Patch('me')
  updateMe(
    @Req() req: any,
    @Body() data: { name?: string; image?: string },
  ) {
    return this.userService.updateProfile(req.user.id, data);
  }
}
