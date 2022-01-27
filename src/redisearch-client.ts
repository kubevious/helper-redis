import _ from 'the-lodash'
import { RedisClient } from './redis-client';


export class RedisearchClient
{
    private _client : RedisClient;

    constructor(client : RedisClient)
    {
        this._client = client;
    }

    index(name: string)
    {
        return new RedisearchIndexClient(this._client, name);
    }

    list()
    {
        return this._client.execCustom('FT._LIST', [])
            .then(result => {
                return <string[]>result;
            })
    }

}

export class RedisearchIndexClient
{
    private _client : RedisClient;
    private _name : string;

    constructor(client : RedisClient, name : string)
    {
        this._client = client;
        this._name = name;
    }

    create(prefix: PrefixParams, fields: IndexField[]) : Promise<CommandResult>
    {
        const args = [
            this._name,
            'ON',
            'hash',
            'PREFIX',
            prefix.count,
            prefix.prefix,
            'SCHEMA',
        ]

        for(let field of fields)
        {
            args.push(field.name);

            const type = field.type || 'TEXT';
            args.push(type)

            if (field.isSortable) {
                args.push('SORTABLE')
            }
        }

        return this._client.execCustom('FT.CREATE', args, {
            handleError: (reason) => {
                if (reason.message == 'Index already exists') {
                    return {
                        success: false
                    }
                }
            }
        })
        .then(result => {
            if (result == 'OK') {
                return {
                    success: true
                }
            }
            return result;
        })
        ;
    }

    delete() : Promise<CommandResult>
    {
        return this._client.execCustom('FT.DROPINDEX', [this._name], {
            handleError: (reason) => {
                if (reason.message == 'Unknown Index name') {
                    return {
                        success: false
                    }
                }
            }
        })
        .then(result => {
            if (result == 'OK') {
                return {
                    success: true
                }
            }
            return result;
        })
    }


    search(query: string, options?: SearchOptions) : Promise<SearchResult>
    {
        options = options || {};
        options.pagination = options.pagination || {};

        const args : any[] = [
            this._name,
            query
        ]

        args.push('LIMIT');
        args.push(options.pagination.first || 0);
        args.push(options.pagination.number || 100);

        if (options.fields) {
            if (options.fields.length == 0) {
                args.push('NOCONTENT');
            } else {
                args.push('RETURN');
                args.push(options.fields.length);
                for(let x of options.fields) {
                    args.push(x);
                }
            }
        }

        return this._client.execCustom('FT.SEARCH', args)
        .then(result => {
            if (!_.isArray(result)) {
                throw new Error("Unknown search result");
            }

            const searchResult : SearchResult = {
                items: []
            } 

            for(let i = 1; i < result.length - 1; i+=2)
            {
                const item : SearchResultItem = {
                    key: result[i],
                    value: {}
                }
                const payload = result[i+1];
                for(let j = 0; j < payload.length; j+=2)
                {
                    const property : string = payload[j];
                    item.value[property] = payload[j+1];
                }

                searchResult.items.push(item);
            }

            return searchResult;
        })
        ;
    }

    aggregate(query: string, options?: AggregateOptions) : Promise<Record<string, any>[]>
    {
        options = options || {};
        options.pagination = options.pagination || {};

        const args : any[] = [
            this._name,
            query
        ]

        args.push('LIMIT');
        args.push(options.pagination.first || 0);
        args.push(options.pagination.number || 100);

        if (options.groupBy) {
            args.push('GROUPBY');
            args.push(options.groupBy.length);
            for(let x of options.groupBy) {
                args.push(`@${x}`);
            }
        }

        return this._client.execCustom('FT.AGGREGATE', args)
        .then(result => {

            if (!_.isArray(result)) {
                throw new Error("Unknown search result");
            }

            const items: Record<string, any>[] = [];
            
            for(let i = 1; i < result.length; i++)
            {
                const payload = result[i];

                const item : Record<string, any> = {};
                for(let j = 0; j < payload.length; j+=2)
                {
                    const property : string = payload[j];
                    item[property] = payload[j+1];
                }

                items.push(item);
            }

            return items;
        })
        ;
    }

    info()
    {
        return this._client.execCustom('FT.INFO', [this._name])
            .catch(reason => {
                if (reason.message == 'Unknown Index name') {
                    return null;
                }
                this._client.logger.error("Error:", reason);
                throw reason;
            })
            .then(result => {
                if (!_.isArray(result)) {
                    return null;
                }

                const info : Record<string, any> = makeDictFromArray(result, (key, value) => {

                    if (key === 'gc_stats') {
                        return makeDictFromArray(value, (key, value) => parseInt(value));
                    }
                    if (key === 'cursor_stats') {
                        return makeDictFromArray(value);
                    }
                    if (key === 'fields') {
                        return _.makeDict(value, x => x[0], x => x);
                    }
                    if (key === 'attributes') {
                        return _.makeDict(value, x => x[1], x => x);
                    }

                    if (_.startsWith(key, 'num_'))
                    {
                        return parseInt(value);
                    }

                    if ( _.endsWith(key, 'mb') || _.endsWith(key, 'avg') || _.startsWith(key, 'percent'))
                    {
                        return parseFloat(value);
                    }

                    return value;
                });

                return info;
            })
            ;
    }

}

export interface PrefixParams {
    count: number,
    prefix: string
}

export interface IndexField {
    name: string,
    type?: 'TEXT' | 'TAG' | 'NUMERIC' | 'GEO',
    
    isSortable?: boolean,
}

export interface SearchPaging {
    first?: number,
    number?: number 
}

export interface SearchOptions {
    pagination?: SearchPaging,
    fields?: string[]
}

export interface AggregateOptions {
    pagination?: SearchPaging,
    groupBy?: string[]
}

export interface CommandResult {
    success: boolean
}

export interface SearchResultItem {
    key: string,
    value: Record<string, any>
}

export interface SearchResult {
    items: SearchResultItem[];
}

function makeDictFromArray(arr : string[], massageValue? : (key: string, value: any) => any) : Record<string, any>
{
    const dict : Record<string, any> = {};

    for(let i = 0; i < arr.length; i+=2)
    {
        const key = arr[i];
        let value = arr[i+1];
        if (massageValue) {
            value = massageValue(key, value);
        }
        dict[key] = value;
    }

    return dict;
}