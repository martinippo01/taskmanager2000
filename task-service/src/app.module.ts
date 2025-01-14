import TaskAgentController from '@controllers/TaskAgentController';
import TaskServiceDomainImpl from '@domains/TaskServiceDomainImpl';
import { TaskServiceDomain } from '@interfaces/domains/TaskServiceDomain';
import { Module } from '@nestjs/common';

@Module({
  imports: [],
  controllers: [TaskAgentController],
  providers: [
    {
      provide: TaskServiceDomain,
      useClass: TaskServiceDomainImpl,
    },
  ],
})
export class AppModule {}
