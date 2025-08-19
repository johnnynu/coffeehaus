export const mockActivities = [
  {
    id: 1,
    type: "photo" as const,
    user: { name: "A M.", avatar: "/user-profile-illustration.png" },
    timestamp: "1 minute ago",
    action: "added 2 photos",
    business: {
      name: "The Italian Deli Co",
      rating: 4.1,
      reviewCount: 41,
      category: "Italian, Delis, Pasta Shops",
    },
    images: ["/latte-art-heart-cup.png", "/dark-roasting-coffee-beans.png"],
  },
  {
    id: 2,
    type: "photo" as const,
    user: { name: "Christina J.", avatar: "/diverse-woman-smiling.png" },
    timestamp: "1 minute ago",
    action: "added 5 photos",
    business: {
      name: "Mangiafoglie",
      rating: 4.5,
      reviewCount: 94,
      category: "Pizza, Coffee & Tea, Breakfast & Brunch",
    },
    images: [
      "/cozy-warm-coffee-shop.png",
      "/man-beard-coffee.png",
      "/latte-art-heart-cup.png",
      "/dark-roasting-coffee-beans.png",
    ],
  },
  {
    id: 3,
    type: "review" as const,
    user: { name: "A M.", avatar: "/user-profile-illustration.png" },
    timestamp: "1 minute ago",
    action: "wrote a review",
    business: {
      name: "The Italian Deli Co",
      rating: 4,
      reviewCount: 0,
      category: "Italian, Delis",
    },
    image: "/cozy-warm-coffee-shop.png",
    reviewText:
      "It was legit! Pizza had a crispy crust, pasta bolognese was never ending.",
    fullReviewText:
      "It was legit! Pizza had a crispy crust, pasta bolognese was never ending- we kept eating & eating and we still had pasta tiramisu was delicious ice tea was meh! No flavor at all - tasted like water. The atmosphere was cozy and perfect for a date night. Service was attentive and the staff was knowledgeable about the menu. Would definitely come back for the pasta!",
  },
  {
    id: 4,
    type: "review" as const,
    user: { name: "Christina J.", avatar: "/diverse-woman-smiling.png" },
    timestamp: "1 minute ago",
    action: "wrote a review",
    business: {
      name: "Mangiafoglie",
      rating: 4.5,
      reviewCount: 0,
      category: "Pizza, Coffee & Tea",
    },
    image: "/latte-art-heart-cup.png",
    reviewText:
      "NEW FAVE RESTAURANT ALERT! The coffee is exceptional and the breakfast menu is creative.",
    fullReviewText:
      "NEW FAVE RESTAURANT ALERT! Not sure why it took me so long to get here, but now that I have discovered this gem, I'll be back regularly. The coffee is exceptional - rich, smooth, and perfectly brewed. The baristas clearly know their craft. The breakfast menu is creative and everything we tried was delicious. The avocado toast was elevated with unique toppings, and the pastries were fresh and flaky. The atmosphere strikes the perfect balance between cozy and energetic. Highly recommend for both coffee lovers and food enthusiasts!",
  },
  {
    id: 5,
    type: "review" as const,
    user: { name: "Susie C.", avatar: "/woman-glasses-coffee.png" },
    timestamp: "1 minute ago",
    action: "wrote a review",
    business: {
      name: "Duchess",
      rating: 4,
      reviewCount: 0,
      category: "Coffee & Tea",
    },
    image: "/dark-roasting-coffee-beans.png",
    reviewText:
      "The customer service here is amazing, and the coffee quality is consistently good.",
    fullReviewText:
      "The customer service here is amazing, and I really appreciated being offered water while I waited for my order. The staff is friendly and accommodating, making the experience pleasant from start to finish. The coffee quality is consistently good, and they have a nice variety of brewing methods available. The space is clean and comfortable with plenty of seating options. My only minor complaint is that it can get quite busy during peak hours, but the efficient service keeps things moving. A reliable spot for quality coffee and excellent service.",
  },
  {
    id: 6,
    type: "photo" as const,
    user: { name: "Tiffany H.", avatar: "/diverse-woman-smiling.png" },
    timestamp: "1 minute ago",
    action: "added 2 photos",
    business: {
      name: "Sunright Tea Studio",
      rating: 4,
      reviewCount: 166,
      category: "$$, Bubble Tea",
    },
    images: ["/cozy-warm-coffee-shop.png", "/man-beard-coffee.png"],
  },
];
