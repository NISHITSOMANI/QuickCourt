const CircuitBreaker = require('opossum');
const config = require('../config/env');
const { logger } = require('../config/logger');

class ServiceCircuitBreaker {
    constructor(serviceName, action, options = {}) {
        this.serviceName = serviceName;
        this.stats = {};

        // Default circuit breaker options
        const defaultOptions = {
            timeout: options.timeout || config.circuitBreaker.timeout,
            errorThresholdPercentage: options.errorThresholdPercentage || config.circuitBreaker.errorThresholdPercentage,
            resetTimeout: options.resetTimeout || config.circuitBreaker.resetTimeout,
            name: serviceName,
            enabled: options.enabled !== false, // Enabled by default
        };

        // Create the circuit breaker
        this.breaker = new CircuitBreaker(action, defaultOptions);

        // Set up event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.breaker.on('open', () => {
            logger.warn(`[${this.serviceName}] Circuit breaker opened`);
            this.stats = { ...this.breaker.stats, state: 'open' };
        });

        this.breaker.on('halfOpen', () => {
            logger.info(`[${this.serviceName}] Circuit breaker half-open`);
            this.stats = { ...this.breaker.stats, state: 'halfOpen' };
        });

        this.breaker.on('close', () => {
            logger.info(`[${this.serviceName}] Circuit breaker closed`);
            this.stats = { ...this.breaker.stats, state: 'closed' };
        });

        this.breaker.on('failure', (error) => {
            logger.error(`[${this.serviceName}] Circuit breaker failure:`, error);
            this.stats.lastError = error.message;
        });
    }

    async execute(...args) {
        try {
            const result = await this.breaker.fire(...args);
            this.stats = { ...this.breaker.stats, state: this.breaker.status };
            return result;
        } catch (error) {
            this.stats.lastError = error.message;
            throw error;
        }
    }

    getStats() {
        return {
            ...this.stats,
            state: this.breaker.status,
            failures: this.breaker.stats.failures,
            fallbacks: this.breaker.stats.fallbacks,
            successes: this.breaker.stats.successes,
            rejections: this.breaker.stats.rejections,
            fires: this.breaker.stats.fires,
            timeouts: this.breaker.stats.timeouts,
            errorRate: this.breaker.stats.fires > 0
                ? (this.breaker.stats.failures / this.breaker.stats.fires) * 100
                : 0,
        };
    }

    isOpen() {
        return this.breaker.opened;
    }

    isClosed() {
        return !this.breaker.opened;
    }
}

module.exports = ServiceCircuitBreaker;
