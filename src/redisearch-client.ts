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
            args.push('TEXT')
            args.push('SORTABLE')

            // rating NUMERIC SORTABLE
            // genre TAG SORTABLE
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


    search(query: string, pagination?: SearchPaging) : Promise<SearchResult>
    {
        const args : any[] = [
            this._name,
            query
        ]

        pagination = pagination || {}
        args.push('LIMIT');
        args.push(pagination.first || 0);
        args.push(pagination.number || 100);

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

}

export interface PrefixParams {
    count: number,
    prefix: string
}

export interface IndexField {
    name: string,
}

export interface SearchPaging {
    first?: number,
    number?: number 
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