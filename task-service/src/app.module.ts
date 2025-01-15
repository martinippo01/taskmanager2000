import TaskAgentController from '@controllers/TaskAgentController';
import TaskServiceDomainImpl from '@domains/TaskServiceDomainImpl';
import { TaskServiceDomain } from '@interfaces/domains/TaskServiceDomain';
import { TaskAgentDao } from '@interfaces/repositories/TaskAgentDao';
import { Module } from '@nestjs/common';
import TaskAgentDaoImpl from '@repositories/TaskAgentDaoImpl';
import {
  TaskAgentDaoClient,
  taskAgentDaoClientUseFactory,
} from '@repositories/TaskAgentDaoProvider';

@Module({
  imports: [],
  controllers: [TaskAgentController],
  providers: [
    {
      provide: TaskServiceDomain,
      useClass: TaskServiceDomainImpl,
    },
    {
      provide: TaskAgentDao,
      useClass: TaskAgentDaoImpl,
    },
    {
      provide: TaskAgentDaoClient,
      useFactory: taskAgentDaoClientUseFactory,
    },
  ],
})
export class AppModule {}
