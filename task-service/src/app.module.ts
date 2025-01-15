import { ConfigModuleValidationSchema } from '@configs/ConfigValidationSchema';
import TaskAgentController from '@controllers/TaskAgentController';
import TaskServiceDomainImpl from '@domains/TaskServiceDomainImpl';
import { TaskServiceDomain } from '@interfaces/domains/TaskServiceDomain';
import { TaskAgentDao } from '@interfaces/repositories/TaskAgentDao';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import TaskAgentDaoImpl from '@repositories/TaskAgentDaoImpl';
import {
  TaskAgentDaoClient,
  taskAgentDaoClientUseFactory,
} from '@repositories/TaskAgentDaoProvider';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: ConfigModuleValidationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
  ],
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
