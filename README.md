# Axios Plus

Simply axios plus some extra features

## Basic usage

```
import $axios from 'axios-plus'
// you can still do basically normal axios stuff
$axios.get(url, config)
$axios.post(url, data, config)
const $myAxios = $axios.create(config)
```

## Special Features

- Routes definition
- Named routes
- Functional routes
- Url path placeholder
- Data and config consolidation (just for syntax)

## Routes definition

Route can be defined globally, or scoped to and axios plus instance and can be easily reused throughout your code

```
import $axios from 'axios-plus'

// Global routes
$axios.routes([
  {
    path: 'http://thirdpartyapi.com',
    name: 'fetchThirdPartyData',
  }
])

// Scoped routes
const $myAxios = $axios.create({
  baseUrl: 'http://localhost:8080/api/v1/',
  routes: [
    {
      path: 'users',
      name: 'fetchTwelveUsers',
      params: {paginationSize: 12}
    }
  ]
})
```

Note: the scoped routes will have access to the global route

The routes is an array of object (route definition),
A route is an object that can be defined with 4 properties

- name: the name of the route (will be useful later)
- path: the url of the route, relative or full
- params: set a route scope url query params
- method: HTTP method for the request, defaults to "get"

### Named routes

Naming route is extremely useful for portable and reusabality, and promotes consistency with url changes

after creating a route with a name property
name route can be referenced in the url parameter
by preceeding the route name with a $ sign

```
import $axios from 'axios-plus'

axiosß
  .get('$fetchThirdPartyData')
  .then(res => console.log(res))
  .catch(err => console.log(err.stack, err.response))
```

Now any change made to the route e.g. url will be consistent everywhere the named route was referenced

## Functional routes

Functional routes are a way to both simplify request and reduce url string typos.
route functions can only be created at a scoped instance i.e. using $axios.create(config)
this feature is disable by default

```
import $axions from 'axios-plus'

// enabling route functions, by setting addRouteMethod to true in the config
const $myAxios = $axios.create({
  addRouteMethod: true,
  routes: [
    {
      name: 'fetchTwelveUsers',
      path: 'http://localhost:8080/api/v1/users',
      params: {paginationSize: 12}
    },
    {
      method: 'post',
      name: 'createNewUser',
      path: 'http://localhost:8080/api/v1/users'
    }
  ]
})
```

Now a fetchUsers method will now be availble in the $myAxios instance,
and can be used as demonstrated below

```
// get request
await $myAxios.fetchTwelveUsers()

// post request
await $myAxios.createNewUser(data)
```

## Url path placeholder

For a descriptive url with less url string manipulation,
you can add simple descriptive placeholders to url path with a colon preceeding the placeholder name
e.g. http://domain.tld/path/:placeholder/action

Simple example

```
import $axios from 'axiosPlus'

$axios.delete('http://localhost:8080/users/:userId', {
  vars: {userId: 1}
})
```

Named route example

```
import $axios from 'axiosPlus'

const $myAxios = $axios.create({
  addRouteMethod: true,
  routes: [
    {
      name: 'fetchUser',
      path: 'http://localhost:8080/api/v1/users/:userId',
    },
  ]
})

$axios.fetchUser((
  vars: {userId: 1}
))

```

## Data and config consolidation (just for syntax)

Config data can be added to request data by adding a $ sign before the config property this distiguises the data and the configs

Difference

```
import $axios from 'axios-plus'

/* Consolidated */

$axios.post('$createNewUser', {
  firstName: 'Adam',
  lastName: 'God',
  location: 'eden',

  $headers: {
    authorization: 'jdhowehowihoihe0fw09ruwfnohwh08wf'
  }

  $placeholders: {
    role: 'admin',
  }
})

/* Seperated */

$axios.post(
  '$createNewUser',
  {
    firstName: 'Adam',
    lastName: 'God',
    location: 'eden',
  },
  {
    headers: {
      authorization: 'jdhowehowihoihe0fw09ruwfnohwh08wf'
    }

    placeholders: {
      role: 'admin',
    }
  }
)
```