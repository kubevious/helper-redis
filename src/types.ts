export interface RedisNodeInfo {
    host: string,
    port: number,
}

export interface RedisClusterNodeInfo extends RedisNodeInfo {
    nat?: string,
}

export interface RedisClusterParams {
    nodes: RedisClusterNodeInfo[]
}

export interface RedisSingleParams extends RedisNodeInfo {
}


export interface RedisClientParams extends Partial<RedisSingleParams>, Partial<RedisClusterParams> {
    isCluster: boolean
}