import {
    Injectable,
    OnApplicationBootstrap,
    OnApplicationShutdown,
    Logger,
} from '@nestjs/common';
import Consul = require('consul');

@Injectable()
export class ConsulService
    implements OnApplicationBootstrap, OnApplicationShutdown {
    private readonly logger = new Logger(ConsulService.name);
    private consul: any;
    private serviceId: string;

    constructor() {
        this.consul = new Consul({
            host: process.env['CONSUL_HOST'] || '127.0.0.1',
            port: process.env['CONSUL_PORT'] || '8500',
            promisify: true,
        } as any);
        this.serviceId = `service-${process.env['SERVICE_NAME'] || 'unknown'}-${Date.now()}`;
    }

    async onApplicationBootstrap() {
        const serviceName = process.env['SERVICE_NAME'] || 'base-micro-service';
        const servicePortRaw = process.env['PORT'];
        const servicePort = servicePortRaw ? parseInt(servicePortRaw, 10) : 3000;
        const serviceHost = process.env['SERVICE_HOST'] || '127.0.0.1';

        try {
            await this.consul.agent.service.register({
                id: this.serviceId,
                name: serviceName,
                address: serviceHost,
                port: servicePort,
                check: {
                    http: `http://${serviceHost}:${servicePort}/health`, // assuming there's a health endpoint or similar check
                    interval: '10s',
                    timeout: '5s',
                },
            });
            this.logger.log(`Service registered with Consul: ${serviceName} [${this.serviceId}]`);
        } catch (error) {
            const err = error as Error;
            this.logger.warn(`Failed to register with Consul: ${err.message}`);
            // Usually, we shouldn't fail the whole app if Consul is down
        }
    }

    async onApplicationShutdown() {
        try {
            await this.consul.agent.service.deregister(this.serviceId);
            this.logger.log(`Service deregistered from Consul: [${this.serviceId}]`);
        } catch (error) {
            const err = error as Error;
            this.logger.error(`Failed to deregister from Consul: ${err.message}`);
        }
    }
}
