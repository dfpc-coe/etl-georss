import { Static, Type, TSchema } from '@sinclair/typebox';
import type { InputFeatureCollection } from '@tak-ps/etl'
import ETL, { Event, SchemaType, handler as internal, local, env } from '@tak-ps/etl';

const Environment = Type.Object({
    URL: Type.String(),
    QueryParams: Type.Optional(Type.Array(Type.Object({
        key: Type.String(),
        value: Type.String()
    }))),
    Headers: Type.Optional(Type.Array(Type.Object({
        key: Type.String(),
        value: Type.String()
    }))),
});

export default class Task extends ETL {
    static name = 'etl-georss';

    async schema(type: SchemaType = SchemaType.Input): Promise<TSchema> {
        if (type === SchemaType.Input) {
            return Environment
        } else {
            return Type.Object({})
        }
    }

    async control(): Promise<void> {
        const env = await this.env(Environment);

        const url = new URL(env.URL);

        for (const param of env.QueryParams || []) {
            url.searchParams.append(param.key, param.value);
        }

        const headers: Record<string, string> = {};
        for (const header of env.Headers || []) {
            headers[header.key] = header.value;
        }

        await fetch(url, {
            method: 'GET',
            headers
        });

        const fc: Static<typeof InputFeatureCollection> = {
            type: 'FeatureCollection',
            features: []
        };

        await this.submit(fc);
    }
}

await local(new Task(import.meta.url), import.meta.url);
export async function handler(event: Event = {}) {
    return await internal(new Task(import.meta.url), event);
}

