import csv
import copy
import json
import random

users = []
with open('users.csv', 'r') as f:
  for items in list(csv.reader(f, delimiter=',')):
    users.append({
      'user_id': items[0],
      'first_name': items[1],
      'last_name': items[2],
      'email': items[3]
    })

cities = []
with open('cities.csv', 'r') as f:
  for items in list(csv.reader(f, delimiter=',')):
    cities.append({
      'city': items[0],
      'country': items[1]
    })

bookings = []
with open('reviews.csv', 'r') as f:
  for items in list(csv.reader(f, delimiter=','))[1:]:
    user = copy.copy(random.choice(users))
    booking = {
      'user': user,
      'start_date': items[2],
      'length_days': random.choice('1212412313256283451734187'),
    }
    if (random.random() > 0.32):
      rating = random.choice('12122454455531234123413')
      booking['review'] = {
        'text': items[5],
        'rating': rating
      }
    bookings.append(booking)

listings = []
with open('listings.csv', 'r') as f:
  for items in list(csv.reader(f, delimiter=','))[1:]:
    if len(items[74]) == 0:
      continue
    price = items[57].replace('$', '').replace(',', '')
    listing_bookings = []
    num_bookings = int(random.choice('01231234567895989845769845694894347'))
    for i in range(num_bookings):
      booking = random.choice(bookings)
      booking['cost_usd'] = "%.2f" % round(float(price) * float(booking['length_days']) * (0.87 + random.random() / 5), 2)
      if booking['start_date'] > items[74]:
          listing_bookings.append(booking)
    city = random.choice(cities)
    listings.append({
      'listing_id': items[0],
      'title': items[4],
      'description': items[7],
      'city': city['city'],
      'country': city['country'],
      'listed_date': items[74],
      'cancellation_policy': items[87],
      'price_usd': price,
      'bathrooms': items[53],
      'bedrooms': items[53],
      'beds': items[53],
      'bookings': listing_bookings
    })

data = []
for user in users:
  user_listings = []
  num_listings = int(random.choice('00000000001111122234678'))
  for i in range(num_listings):
    if len(listings) == 0:
      break
    user_listings.append(listings.pop(int(random.random() * len(listings))))
  user['listings'] = user_listings
  data.append(user)

with open('data.json', 'w') as f:
  f.write(json.dumps(data, indent=4))
