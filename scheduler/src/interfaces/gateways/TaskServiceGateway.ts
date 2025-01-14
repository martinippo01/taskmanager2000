export interface TaskServiceGateway {
    /**
     * Confirms if the task exists in the Task Service.
     * @param taskId - The ID of the task to confirm.
     * @returns A promise that resolves to a boolean indicating if the task exists.
     */
    confirmTaskExists(taskId: string): Promise<boolean>;

    /**
     * Retrieves the queue where the request should be sent.
     * @param taskId - The ID of the task to get the queue for.
     * @returns A promise that resolves to the name of the queue.
     */
    getTaskQueue(taskId: string): Promise<string>;

    /**
     * Exposes the ping endpoint to the Task Service for health check.
     * @returns A promise that resolves to a boolean indicating if the Task Service is healthy.
     */
    pingTaskService(): Promise<boolean>;
}