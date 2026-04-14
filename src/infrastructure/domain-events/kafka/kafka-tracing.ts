import {
    context,
    propagation,
    ROOT_CONTEXT,
    TextMapGetter,
} from '@opentelemetry/api';
import { KafkaJS } from '@confluentinc/kafka-javascript';

const kafkaHeadersGetter: TextMapGetter<KafkaJS.IHeaders> = {
    get(carrier, key) {
        const value = carrier[key];
        if (Buffer.isBuffer(value)) {
            return value.toString();
        }

        if (Array.isArray(value)) {
            const first = value[0];
            return Buffer.isBuffer(first) ? first.toString() : first;
        }

        return value;
    },
    keys(carrier) {
        return Object.keys(carrier);
    },
};

export const extractKafkaContext = (headers?: KafkaJS.IHeaders) =>
    propagation.extract(ROOT_CONTEXT, headers ?? {}, kafkaHeadersGetter);

export const injectKafkaHeaders = (): KafkaJS.IHeaders => {
    const headers: KafkaJS.IHeaders = {};
    propagation.inject(context.active(), headers);
    return headers;
};
