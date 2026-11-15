import type { Server } from 'node:http'

import request from 'supertest'

export function createPeopleClient(
  server: Server,
  { authorization }: { authorization: string },
) {
  const send = (
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    path: string,
  ) =>
    request(server)
      [method](`/api/v1/people${path}`)
      .set('Authorization', authorization)
  return {
    list: (query = '') => send('get', query),
    create: (body: object) => send('post', '').send(body),
    get: (id: string) => send('get', `/${id}`),
    patch: (id: string, body: object) => send('patch', `/${id}`).send(body),
    archive: (id: string) => send('post', `/${id}/archive`),
    restore: (id: string) => send('post', `/${id}/restore`),
    remove: (id: string) => send('delete', `/${id}`),
    getGoal: (id: string) => send('get', `/${id}/goal`),
    saveGoal: (id: string, body: object) =>
      send('put', `/${id}/goal`).send(body),
    estimateGoal: (id: string, body: object) =>
      send('post', `/${id}/goals/estimate`).send(body),
    getBodyParameters: (id: string) => send('get', `/${id}/body-parameters`),
    saveBodyParameters: (id: string, body: object) =>
      send('put', `/${id}/body-parameters`).send(body),
    removeBodyParameters: (id: string) =>
      send('delete', `/${id}/body-parameters`),
    restrictions: (kind: RestrictionKind) => ({
      list: (id: string) => send('get', `/${id}/${kind}`),
      add: (id: string, body: object) =>
        send('post', `/${id}/${kind}`).send(body),
      patch: (id: string, itemId: string, body: object) =>
        send('patch', `/${id}/${kind}/${itemId}`).send(body),
      remove: (id: string, itemId: string) =>
        send('delete', `/${id}/${kind}/${itemId}`),
    }),
  }
}

export type RestrictionKind = 'allergies' | 'exclusions' | 'preferences'

export type PeopleClient = ReturnType<typeof createPeopleClient>
