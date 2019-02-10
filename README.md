# train-checker

A quick project that gather the status of the UK stations and trains.

How to use it ?

- Clone the repo
- Run

```sh
npm install
```

- Run npm link

```sh
npm link
```

The "train-checker" command is now available. An usual example is as follow :

```sh
# save a journey
train-checker save-journey EUS MAN

# get the status of the train. This is going to send the result of arrivals and departures in each station
train-checker status

# then you can get the status of each individual trains by using their indexes
train checker train-status 1-2
```