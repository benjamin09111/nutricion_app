import { Module } from '@nestjs/common';
import { PermissionsModule } from '../permissions/permissions.module';
import { PersonalNotesController } from './personal-notes.controller';
import { PersonalNotesService } from './personal-notes.service';

@Module({
  imports: [PermissionsModule],
  controllers: [PersonalNotesController],
  providers: [PersonalNotesService],
})
export class PersonalNotesModule {}
