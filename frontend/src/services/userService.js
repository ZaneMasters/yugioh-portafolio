import publicApi from './publicApi'

export const userService = {
  getPublicUsers: () => publicApi.get('/users/public'),
}
