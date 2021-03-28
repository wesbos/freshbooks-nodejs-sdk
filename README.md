# FreshBooks NodeJS SDK

[![npm](https://img.shields.io/npm/v/@freshbooks/api)](https://www.npmjs.com/package/@freshbooks/api)
[![GitHub Workflow Status](https://img.shields.io/github/workflow/status/freshbooks/freshbooks-nodejs-sdk/Run%20Tests)](https://github.com/freshbooks/freshbooks-nodejs-sdk/actions?query=workflow%3A%22Run+Tests%22)

The FreshBooks NodeJS SDK is a collection of single-purpose packages designed to easily build FreshBooks apps. Each package delivers part of the [FreshBooks API](https://www.freshbooks.com/api), so that you can choose the packages that fit your needs.

| Package                             | What it's for                                                                                                                 |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| [`@freshbooks/api`](https://www.npmjs.com/package/@freshbooks/api) | Get/set data from FreshBooks using the REST API.                                                                              |
| [`@freshbooks/events`](https://www.npmjs.com/package/@freshbooks/events)                | Register/listen for incoming events via webhooks.                                                                             |
| [`@freshbooks/app`](https://www.npmjs.com/package/@freshbooks/api) | Pre-configured [ExpressJS](https://expressjs.com/) app. Includes authentication via [PassportJS](http://www.passportjs.org/). |

## Installation

Use your favorite package manager to install any of the packages and save to your `package.json`:

```shell
$ npm install @freshbooks/api @freshbooks/events @freshbooks/app

# Or, if you prefer yarn
$ yarn add @freshbooks/api @freshbooks/events @freshbooks/app
```

## Usage

### `@freshbooks/api`

Your app will interact with the REST API using the `Client` object, available from the `@freshbooks/api` package.
The client is instantiated with a valid OAuth token, which is used throughout the lifetime of the client to make API calls.

#### Configuring the API client

```typescript
import { Client } from '@freshbooks/api'

const clientId = process.env.FRESHBOOKS_APPLICATION_CLIENTID

// Get token from authentication or configuration
const token = process.env.FRESHBOOKS_TOKEN

// Instantiate new FreshBooks API client
const client = new Client(token, {
    clientId: FRESHBOOKS_APPLICATION_CLIENTID
});
```

#### Get/set data from REST API

All REST API methods return a response in the shape of:

```typescript
{
  ok: boolean
  data?: T // model type of result
  error?: Error
}
```

Example API client call:

```typescript
try {
    // Get the current user
    const { data } = await client.users.me()

    console.log(`Hello, ${data.id}`)
} catch ({ code, message }) {
    // Handle error if API call failed
    console.error(`Error fetching user: ${code} - ${message}`)
}
```

#### Building custom queries

If an endpoint supports searching or custom inclusions via query parameters, these parameters
can be specified using a `QueryBuilderType`:

```typescript
type QueryBuilderType = IncludesQueryBuilder | SearchQueryBuilder
```

An appropriate method on the API client will support an array of builders:

```typescript
public readonly invoices = {
  list: (accountId: string, queryBuilders?: QueryBuilderType[]) => Promise<Result<{
      invoices: Invoice[];
      pages: Pagination;
  }>>;
}
```

The `SearchQueryBuilder` supports the patterns: `Equals`, `In`, `Like` and `Between`.

Example API client call with `SearchQueryBuilder`:

```typescript
//create and populate SearchQueryBuilder
const searchQueryBuilder = new SearchQueryBuilder()
    .like('address_like', '200 King Street')
    .between('date', { min: new Date('2010-05-06'), max: new Date('2019-11-10') })

try {
    // Get invoices matching search query
    const { data } = await client.invoices.list('xZNQ1X', [searchQueryBuilder])

    console.log('Invoices: ', data)
} catch ({ code, message }) {
    // Handle error if API call failed
    console.error(`Error fetching user: ${code} - ${message}`)
}
```

The `IncludesQueryBuilder` simply requires the name of the key to be included.

Example API client call with `IncludesQueryBuilder`:

```typescript
//create and populate IncludesQueryBuilder
const includesQueryBuilder = new IncludesQueryBuilder().includes('lines')

try {
    // Get invoices with included line items
    const { data } = await client.invoices.list('xZNQ1X', [includesQueryBuilder])

    console.log('Invoices: ', data)
} catch ({ code, message }) {
    // Handle error if API call failed
    console.error(`Error fetching user: ${code} - ${message}`)
}
```

##### Optional fields

Optional fields are specified in the API data model as `optional` using Typescript's `?` operator, as well as marked as `Nullable<T>`, where `T` is the type of value, and `Nullable` is a type definition to allow `null` values.

```typescript
// create a user model with required fields. set other fields as undefined
const user: User = {
  id: '123',
  firstName: 'Johnny',
  lastName: 'Appleseed'
}

// explicity set an optional field
user.phoneNumbers = [
  {
    title: 'Home',
    number: '555-555-5555'
  }
]

// explicitly unset an optional field
user.phoneNumbers = null
```

##### Errors

If an API error occurs, the response object contains an `error` object, with the following shape:

```typescript
{
  code: string
  message?: string
}
```

##### Pagination

If the endpoint is enabled for pagination, the response `data` object contains the response model and a `pages` property, with the following shape:

```typescript
{
    page: number
    pages: number
    total: number
    size: number
}
```

Example request with pagination:

```typescript
// Get list of invoices for account
const { invoices, pages } = await client.invoices.list('xZNQ1X')

// Print invoices
invoices.map(invoice => console.log(JSON.stringify(invoice)))

// Print pagination
console.log(`Page ${pages.page} of ${pages.total} pages`)
console.log(`Showing ${pages.size} per page`)
console.log(`${pages.size} total invoices`)
```

##### Dates and Times

For historical reasons, some resources in the FreshBooks API (mostly accounting-releated) return date/times in "US/Eastern" timezone. Some effort is taken to convert these in the models to return `Date` objects normalized to UTC.

### `@freshbooks/app`

The FreshBooks SDK provides a pre-configured `ExpressJS` app. This app provides OAuth2 authentication flow, a `PassportJS` middleware for authenticating requests, and session middleware to retrieve tokens for a session.

#### Using the ExpressJS app

Setting up the ExpressJS app requires a FreshBooks `client_id` and `client_secret`, as well as a callback URL to receive user authentication and refresh tokens. Once configured, routes can be configured as in any other `ExpressJS` app.

```typescript
import { Client } from '@freshbooks/api'
import createApp from '@freshbooks/app'

const CLIENT_ID = process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET
const CALLBACK_URL = process.env.CALLBACK_URL

const app = createApp(CLIENT_ID, CLIENT_SECRET, CALLBACK_URL)

// set up callback route
app.get('/auth/freshbooks/redirect', passport.authorize('freshbooks'))

// set up an authenticated route
app.get('/settings', passport.authorize('freshbooks'), async (req, res) => {
  // get an API client
  const { token } = req.user
  const client = new Client(token)

  // fetch the current user
  try {
    const { data } = await client.users.me()
    res.send(data.id)
  } catch ({ code, message }) {
    res.status(500, `Error - ${code}: ${message}`)
  }
})
```

## Development

### Testing

```shell
npm test
```

### Releasing

```bash
HUSKY_SKIP_HOOKS=1 ./node_modules/.bin/lerna publish
```

*Note:* lerna publishing artifacts to github doesn't play too nicely with the git commit hooks installed by
_husky_. If you run into trouble, delete them from `./git/hooks/` and give it a try.

After the new tags have been pushed to github, log in there and create a release from one of the new
tags to push to npm.
