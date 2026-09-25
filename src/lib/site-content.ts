import hero from "../assets/hero.webp.asset.json";
import interior from "../assets/interior.webp.asset.json";
import brunch from "../assets/brunch.webp.asset.json";
import coffee from "../assets/coffee.webp.asset.json";
import food from "../assets/food.webp.asset.json";
import lifestyle from "../assets/lifestyle.webp.asset.json";
import exterior from "../assets/exterior.webp.asset.json";

export const site = {
  name: "Beachwood Cafe",
  address: "2695 N Beachwood Dr, Los Angeles, CA 90068",
  phone: "+917814485357",
  phoneHref: "tel:+917814485357",
  whatsappUrl: "https://wa.me/917814485357?text=Hello%20Cafe",
  email: "kanuvirdi001@gmail.com",
  emailHref: "mailto:kanuvirdi001@gmail.com",
  gmailUrl: "https://mail.google.com/mail/?view=cm&fs=1&to=kanuvirdi001@gmail.com",
  orderUrl: "/menu",
  reserveUrl: "https://www.opentable.com/r/beachwood-los-angeles",
  directionsUrl:
    "https://www.google.com/maps/place/Beachwood+Cafe+Hollywood/@34.1199814,163.631855,3z/data=!4m10!1m2!2m1!1scafe+in+california!3m6!1s0x80c2bf6d60c0fa41:0x3a057cab053ccfd!8m2!3d34.1199814!4d-118.32127!15sChJjYWZlIGluIGNhbGlmb3JuaWFaFCISY2FmZSBpbiBjYWxpZm9ybmlhkgEKcmVzdGF1cmFudOABAA!16s%2Fg%2F11gzrqcym?entry=ttu&g_ep=EgoyMDI2MDkxNi4wIKXMDSoASAFQAw%3D%3D",
  instagram: "https://www.instagram.com/beachwoodcafe/",
  facebook: "https://www.facebook.com/beachwoodcafe/",
  hours: [
    ["Monday — Thursday", "8am — 4pm"],
    ["Friday — Sunday", "8am — 9pm"],
  ],
};

export const images = {
  hero: hero.url,
  interior: interior.url,
  brunch: brunch.url,
  coffee: coffee.url,
  food: food.url,
  lifestyle: lifestyle.url,
  exterior: exterior.url,
};

export type MenuItem = {
  name: string;
  price: string;
  description?: string;
  tags?: string[];
  image?: string;
  featured?: boolean;
  subtitle?: string;
  ingredients?: string[];
  calories?: string;
};
export type MenuGroup = { title: string; note?: string; items: MenuItem[] };
export type MenuSection = { id: string; title: string; service: string; groups: MenuGroup[] };

export const menuSections: MenuSection[] = [
  {
    id: "breakfast",
    title: "Breakfast",
    service: "Served daily, 8am–4pm",
    groups: [
      {
        title: "Beachwood favorites",
        items: [
          {
            name: "Lemon Ricotta Pancakes",
            price: "$18",
            image: "/images/pancakes.jpg",
            featured: true,
            subtitle: "A beloved house favorite since day one.",
            description:
              "Fluffy made-from-scratch ricotta pancakes layered with homemade Meyer lemon sweet cream, fresh California blueberries and raspberries, finished with real Vermont maple syrup.",
            ingredients: [
              "Meyer Lemon Zest",
              "Fresh Ricotta",
              "Organic Blueberries",
              "Sweet Cream",
              "Pure Maple Syrup",
            ],
            tags: ["House Favorite", "Vegetarian"],
          },
          {
            name: "Ricotta Avocado Toast",
            price: "$16",
            image: "/images/avotoast.jpg",
            featured: true,
            subtitle: "Simple, fresh, and exceptionally vibrant.",
            description:
              "Grilled thick-cut country sourdough bread, whipped artisan ricotta, smashed Haas avocados, chopped farm eggs, everything bagel spice, lemon zest, and organic micro kale.",
            ingredients: [
              "Artisan Sourdough",
              "Whipped Ricotta",
              "Haas Avocado",
              "Farm Egg",
              "Micro Kale",
              "EVOO",
            ],
            tags: ["Best Seller", "Vegetarian"],
          },
          {
            name: "Chilaquiles",
            price: "$17",
            subtitle: "Traditional Mexican brunch comfort.",
            description:
              "Freshly made crisp tortilla chips tossed in homemade fire-roasted salsa roja, two farm eggs over medium, crumbled queso fresco, chopped cilantro, and cool crema.",
            ingredients: [
              "Fresh Tortilla Chips",
              "Two Farm Eggs",
              "Fire-Roasted Salsa Roja",
              "Queso Fresco",
              "Cilantro",
              "Mexican Crema",
            ],
            tags: ["Gluten-Free", "House Favorite"],
          },
          {
            name: "Huevos Rancheros",
            price: "$17",
            image: "/images/huevos.jpg",
            featured: true,
            subtitle: "Bold California-Mexican flavors.",
            description:
              "Crispy organic corn tortillas layered with slow-simmered black beans, two farm-fresh sunny eggs, chunky salsa roja, crumbled cotija queso fresco, sliced Haas avocado, and cilantro.",
            ingredients: [
              "Corn Tortillas",
              "Farm Eggs",
              "House Salsa Roja",
              "Black Beans",
              "Cotija Cheese",
              "Haas Avocado",
            ],
            tags: ["Gluten-Free", "Chef Choice"],
          },
          {
            name: "The Beach Burrito",
            price: "$16",
            subtitle: "Hearty canyon morning staple.",
            description:
              "Farm-fresh scrambled eggs, house guacamole, cherrywood smoked bacon, melted cheddar Jack, pico de gallo, and crispy tortilla chips on the side with salsa verde.",
            ingredients: [
              "Scrambled Farm Eggs",
              "Cherrywood Bacon",
              "Cheddar Jack Cheese",
              "House Guacamole",
              "Pico de Gallo",
              "Warm Flour Tortilla",
            ],
            tags: ["Popular"],
          },
          {
            name: "Vegan Burrito",
            price: "$16",
            subtitle: "Plant-based goodness without compromise.",
            description:
              "Artisan veggie sausage, fresh pico de gallo, Haas avocado, organic tofu scramble, melted vegan mozzarella, house salsa verde, and crunchy tortilla chips.",
            ingredients: [
              "Organic Tofu Scramble",
              "Veggie Sausage",
              "Haas Avocado",
              "Vegan Mozzarella",
              "Salsa Verde",
              "Pico de Gallo",
            ],
            tags: ["Vegan"],
          },
        ],
      },
      {
        title: "Eggs & morning bowls",
        items: [
          {
            name: "Smoked Salmon Benedict",
            price: "$21",
            subtitle: "Delicate and sophisticated.",
            description:
              "Wild-caught smoked salmon, poached farm eggs, vine-ripened tomato, dill-chive cream cheese, toasted artisan brioche, and velvety citrus hollandaise.",
            ingredients: [
              "Wild Smoked Salmon",
              "Poached Eggs",
              "Brioche",
              "Herbed Cream Cheese",
              "Lemon Hollandaise",
              "Fresh Dill",
            ],
            tags: ["Chef Choice"],
          },
          {
            name: "Breakfast Sandwich",
            price: "$15",
            subtitle: "The ultimate breakfast stack.",
            description:
              "Over easy farm egg, thick-cut cherrywood smoked bacon, melted sharp cheddar, ripe tomato, sriracha aioli, and baby greens on a buttered brioche bun.",
            ingredients: [
              "Over Easy Farm Egg",
              "Cherrywood Bacon",
              "Aged Cheddar",
              "Sriracha Aioli",
              "Brioche Bun",
            ],
            tags: ["Popular"],
          },
          {
            name: "The Dell Grain Bowl",
            price: "$17",
            subtitle: "Nutrient-packed Hollywood Hills bowl.",
            description:
              "Organic red quinoa, seasoned Spanish rice, baby spinach, roasted fingerling potatoes, tangy cactus salsa, zesty salsa verde, and a soft-poached farm egg.",
            ingredients: [
              "Organic Quinoa",
              "Spanish Rice",
              "Baby Spinach",
              "Fingerling Potatoes",
              "Cactus Salsa",
              "Poached Farm Egg",
            ],
            tags: ["Gluten-Free"],
          },
          {
            name: "Acai Superfood Bowl",
            price: "$14",
            subtitle: "Chilled, organic, and energizing.",
            description:
              "Organic pure Amazonian acai blended with bananas and almond milk, topped with house granola, fresh strawberries, blueberries, toasted coconut, and creamy peanut butter drizzle.",
            ingredients: [
              "Organic Acai",
              "Bananas",
              "House Granola",
              "Strawberries & Blueberries",
              "Coconut Flakes",
              "Peanut Butter",
            ],
            tags: ["Gluten-Free", "Vegan"],
          },
          {
            name: "Brioche French Toast",
            price: "$16",
            subtitle: "Golden, fluffy, and decadent.",
            description:
              "Custard-dipped thick brioche griddled golden brown, dusted with powdered sugar, served with whipped honey butter, fresh berries, and pure Vermont maple syrup.",
            ingredients: [
              "Brioche Bread",
              "Vanilla Egg Custard",
              "Honey Butter",
              "Mixed Berries",
              "Pure Maple Syrup",
            ],
            tags: ["Vegetarian"],
          },
          {
            name: "Canyon Scramble",
            price: "$16",
            subtitle: "Made to order with fresh California herbs.",
            description:
              "Three pasture-raised eggs scrambled with blistered heirloom cherry tomatoes, soft chèvre goat cheese, baby spinach, served with rosemary breakfast potatoes and sourdough.",
            ingredients: [
              "Pasture-Raised Eggs",
              "Goat Cheese",
              "Blistered Tomatoes",
              "Baby Spinach",
              "Rosemary Potatoes",
            ],
            tags: ["Vegetarian", "Gluten-Free Option"],
          },
        ],
      },
    ],
  },
  {
    id: "lunch",
    title: "Lunch",
    service: "Served daily, 11am–4pm",
    groups: [
      {
        title: "Signature bowls & salads",
        note: "All bowls gluten-free friendly",
        items: [
          {
            name: "Fez Grain Bowl",
            price: "$17",
            image: "/images/salad.jpg",
            featured: true,
            subtitle: "Mediterranean spiced nourishing bowl.",
            description:
              "Choice of marinated grilled chicken breast or crispy organic tofu, warm quinoa, roasted wild mushrooms, braised lacinato kale, shaved carrots, roasted golden beets, cool shallot yogurt, and spicy harissa.",
            ingredients: [
              "Quinoa",
              "Grilled Chicken or Tofu",
              "Roasted Mushrooms",
              "Braised Kale",
              "Golden Beets",
              "Shallot Yogurt",
              "Harissa",
            ],
            tags: ["Gluten-Free", "Vegan Option", "Best Seller"],
          },
          {
            name: "Sophia Sesame Bowl",
            price: "$16",
            subtitle: "Crisp, sweet, and nutty Japanese-inspired bowl.",
            description:
              "Pan-seared mirin sesame tofu, seasoned basmati Spanish rice, braised garlic kale, crisp Persian cucumbers, house-pickled daikon radish, and rich sweet peanut sauce.",
            ingredients: [
              "Mirin Sesame Tofu",
              "Basmati Rice",
              "Persian Cucumbers",
              "Daikon Pickles",
              "Braised Kale",
              "Peanut Dressing",
            ],
            tags: ["Vegan", "Gluten-Free"],
          },
          {
            name: "Fiesta Carnitas Bowl",
            price: "$18",
            subtitle: "Vibrant Baja California bowl.",
            description:
              "Choice of slow-braised citrus carnitas, carne asada, grilled chicken, or tofu scramble with Spanish rice, shredded cabbage, black beans, charred pineapple pico, and avocado crema.",
            ingredients: [
              "Choice of Protein",
              "Spanish Rice",
              "Black Beans",
              "Pineapple Pico",
              "Cabbage Slaw",
              "Avocado Crema",
            ],
            tags: ["Gluten-Free"],
          },
          {
            name: "Hollywood Kale Caesar",
            price: "$15",
            subtitle: "Crisp, umami-rich California classic.",
            description:
              "Tender baby kale leaves tossed in housemade creamy garlic dressing with shaved 24-month Parmigiano-Reggiano, herb sourdough croutons, toasted pepita seeds, and lemon zest.",
            ingredients: [
              "Organic Lacinato Kale",
              "Parmesan Reggiano",
              "Sourdough Croutons",
              "Pepita Seeds",
              "House Caesar Dressing",
            ],
            tags: ["Vegetarian"],
          },
        ],
      },
      {
        title: "Artisan sandwiches & burgers",
        items: [
          {
            name: "Beachwood Cheeseburger",
            price: "$19",
            image: "/images/burger.jpg",
            featured: true,
            subtitle: "A classic done to perfection.",
            description:
              "Char-grilled grass-fed chuck patty, melted aged sharp cheddar, crisp butter lettuce, vine-ripened heirloom tomato, shaved red onions, Thousand Island special sauce, and dill pickles on a toasted sesame brioche, served with hand-cut fries.",
            ingredients: [
              "Grass-Fed Beef",
              "Sharp Cheddar",
              "Sesame Brioche",
              "Special Sauce",
              "Heirloom Tomato",
              "Hand-Cut Fries",
            ],
            tags: ["Signature", "Lunch Favorite"],
          },
          {
            name: "Artisan Black Bean Burger",
            price: "$17",
            subtitle: "Award-winning plant-based burger.",
            description:
              "Our signature housemade black bean, quinoa, and walnut patty with heirloom tomato, crisp romaine, house guacamole, and tangy vegan roasted garlic aioli on freshly baked ciabatta.",
            ingredients: [
              "House Black Bean Patty",
              "Walnuts & Quinoa",
              "House Guacamole",
              "Heirloom Tomato",
              "Vegan Garlic Aioli",
              "Ciabatta",
            ],
            tags: ["Vegan", "Contains Walnuts"],
          },
          {
            name: "Chicken Pesto Melt",
            price: "$18",
            subtitle: "Aromatic and cheesy garden sandwich.",
            description:
              "Herb-marinated grilled chicken breast, fresh pulled mozzarella, wild baby arugula, vine tomatoes, and housemade basil-walnut pesto pressed warm on an artisan French roll.",
            ingredients: [
              "Grilled Chicken",
              "Fresh Mozzarella",
              "House Basil Pesto",
              "Baby Arugula",
              "Vine Tomato",
              "French Roll",
            ],
            tags: ["Popular"],
          },
          {
            name: "Canyon Banh Mi",
            price: "$18",
            subtitle: "Crunchy, sweet, and spicy Vietnamese fusion.",
            description:
              "Choice of tender lemongrass chicken or slow-braised pork belly, pickled daikon and carrots, fresh cilantro sprigs, thinly sliced jalapeño, spicy aioli, and sweet honey hoisin on a crusty baguette.",
            ingredients: [
              "Choice of Pork or Chicken",
              "Pickled Daikon & Carrot",
              "Cilantro & Jalapeño",
              "Spicy Aioli",
              "Crusty Baguette",
            ],
            tags: ["Chef Choice"],
          },
        ],
      },
    ],
  },
  {
    id: "dinner",
    title: "Dinner",
    service: "Served Friday–Sunday, 4pm–9pm",
    groups: [
      {
        title: "To begin & share",
        items: [
          {
            name: "Charred Tomato Burrata",
            price: "$16",
            subtitle: "Creamy artisan burrata with sweet blistered tomatoes.",
            description:
              "Creamy imported Italian burrata paired with fire-charred Campari tomatoes, 12-year aged balsamic reduction, fresh sweet basil, and grilled rustic country toast.",
            ingredients: [
              "Artisan Burrata",
              "Charred Campari Tomatoes",
              "Aged Balsamic",
              "Fresh Basil",
              "Grilled Sourdough",
            ],
            tags: ["Vegetarian", "Chef Choice"],
          },
          {
            name: "Whipped Eggplant & Warm Pita",
            price: "$14",
            subtitle: "Smoky, velvety Middle Eastern mezze.",
            description:
              "Slow-roasted smoky eggplant whipped with lemon garlic tahini, ruby pomegranate seeds, wild sumac, organic cold-pressed olive oil, and warm wood-fired pita bread.",
            ingredients: [
              "Roasted Eggplant",
              "Tahini",
              "Pomegranate Seeds",
              "EVOO",
              "Sumac",
              "Wood-Fired Pita",
            ],
            tags: ["Vegan"],
          },
          {
            name: "Brussels Sprout Petals",
            price: "$13",
            subtitle: "Crispy and sweet with a peppery kick.",
            description:
              "Flash-fried tender Brussels sprout petals drizzled with chili hot honey, toasted pine nuts, and showered with shaved aged Pecorino Romano cheese.",
            ingredients: [
              "Brussels Sprouts",
              "Hot Honey Glaze",
              "Toasted Pine Nuts",
              "Pecorino Romano",
            ],
            tags: ["Gluten-Free", "Vegetarian"],
          },
          {
            name: "Crispy Cauliflower with Garlic Tahini",
            price: "$14",
            subtitle: "Golden spice-dusted florets.",
            description:
              "Crispy turmeric-spiced cauliflower florets tossed with toasted sesame seeds and fresh mint, served with green harissa and rich garlic tahini dipping sauce.",
            ingredients: [
              "Crispy Cauliflower",
              "Turmeric & Cumin",
              "Garlic Tahini",
              "Green Harissa",
              "Fresh Mint",
            ],
            tags: ["Vegan", "Gluten-Free"],
          },
          {
            name: "Spinach & Artichoke Dip",
            price: "$15",
            subtitle: "Warm bubbling fonduta.",
            description:
              "Tender braised artichoke hearts, young baby spinach, fontina, gruyère, and parmesan fonduta baked golden bubbling, served with warm house herb tortilla chips.",
            ingredients: [
              "Artichoke Hearts",
              "Baby Spinach",
              "Fontina & Gruyère",
              "Parmesan",
              "Herb Tortilla Chips",
            ],
            tags: ["Vegetarian"],
          },
        ],
      },
      {
        title: "Mains & kitchen entrees",
        items: [
          {
            name: "Chipotle Lime Salmon Tacos",
            price: "$22",
            subtitle: "Bright coastal Pacific flavors.",
            description:
              "Three warm organic corn tortillas filled with blackened wild Pacific salmon, lime-cilantro cabbage slaw, charred pineapple salsa, chipotle crema, and crumbled cotija.",
            ingredients: [
              "Wild Pacific Salmon",
              "Three Corn Tortillas",
              "Pineapple Salsa",
              "Cilantro Slaw",
              "Chipotle Crema",
            ],
            tags: ["Gluten-Free", "Chef Choice"],
          },
          {
            name: "Grilled Wild Salmon Bowl",
            price: "$24",
            subtitle: "Pan-seared coastal perfection.",
            description:
              "Crisp-skinned wild Pacific king salmon fillet served over farro and red quinoa pilaf, charred broccolini, blistered cherry tomatoes, and citrus lemon-caper vinaigrette.",
            ingredients: [
              "Pacific King Salmon",
              "Farro & Quinoa",
              "Charred Broccolini",
              "Blistered Tomatoes",
              "Lemon Caper Vinaigrette",
            ],
            tags: ["Gluten-Free", "Popular"],
          },
          {
            name: "Braised Short Rib Tagliatelle",
            price: "$26",
            subtitle: "Slow-simmered weekend luxury.",
            description:
              "Twelve-hour Cabernet-braised prime beef short rib shredded into rich wild mushroom ragù, tossed with fresh handmade tagliatelle pasta, and finished with 24-month Parmigiano.",
            ingredients: [
              "Braised Short Rib",
              "Fresh Tagliatelle Pasta",
              "Wild Mushrooms",
              "Cabernet Reduction",
              "Parmigiano-Reggiano",
            ],
            tags: ["House Special"],
          },
          {
            name: "Chipotle Steak Wrap",
            price: "$20",
            subtitle: "Char-grilled flank steak with smoky heat.",
            description:
              "Marinated char-grilled flank steak, fire-roasted sweet peppers and caramelized onions, melted pepper jack cheese, and chipotle aioli wrapped in a warm tortilla, served with fries.",
            ingredients: [
              "Grilled Flank Steak",
              "Roasted Peppers & Onions",
              "Pepper Jack",
              "Chipotle Aioli",
              "Hand-Cut Fries",
            ],
            tags: ["Popular"],
          },
          {
            name: "Chicken Avocado BLT Wrap",
            price: "$18",
            subtitle: "Crisp and smoky comfort classic.",
            description:
              "Grilled herb chicken breast, thick-cut applewood bacon, Haas avocado, organic romaine, sweet sundried tomato aioli, wrapped in a spinach tortilla, served with crisp fries.",
            ingredients: [
              "Grilled Herb Chicken",
              "Applewood Bacon",
              "Haas Avocado",
              "Romaine",
              "Sundried Tomato Aioli",
              "Hand-Cut Fries",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "coffee",
    title: "Coffee, tea & drinks",
    service: "Made for slow mornings and canyon afternoons",
    groups: [
      {
        title: "Specialty coffee & espresso",
        items: [
          {
            name: "Ceremonial Matcha Latte",
            price: "$7.00",
            image: "/images/matcha.jpg",
            featured: true,
            subtitle: "Stone-ground organic Japanese matcha.",
            description:
              "Authentic first-harvest ceremonial grade Uji matcha whisked with silky steamed oat milk and a touch of pure organic vanilla bean syrup.",
            ingredients: [
              "Uji Ceremonial Matcha",
              "Steamed Oat Milk",
              "Organic Vanilla Bean",
            ],
            tags: ["Organic", "Best Seller"],
          },
          {
            name: "Artisanal Latte & Flat White",
            price: "$6.50",
            image: "/images/latte_art.jpg",
            featured: true,
            subtitle: "Crafted by experienced canyon baristas.",
            description:
              "Double shot of our custom Beachwood Espresso roast combined with velvety micro-foamed organic milk. Custom flavor options: Bourbon Vanilla, Salted Caramel, or Honey Lavender.",
            ingredients: [
              "Beachwood Espresso",
              "Steamed Microfoam Milk",
              "House Syrup Option",
            ],
            tags: ["House Blend", "Popular"],
          },
          {
            name: "18-Hour Slow Cold Brew",
            price: "$5.50",
            subtitle: "Smooth, chocolatey, low-acid cold brew.",
            description:
              "Single-origin Colombian beans steeped in cold mountain water for 18 slow hours. Served over crystal hand-cut ice with optional sweet cold foam.",
            ingredients: ["Single-Origin Coffee", "Filtered Mountain Water", "Optional Sweet Cold Foam"],
            tags: ["Best Seller"],
          },
          {
            name: "Cappuccino",
            price: "$5.50",
            subtitle: "Traditional Italian 1:1:1 ratio.",
            description:
              "Equal parts bold double espresso, sweet steamed whole milk, and dense velvety froth, lightly dusted with organic cocoa powder.",
            ingredients: ["Double Espresso", "Steamed Whole Milk", "Cocoa Dusting"],
          },
          {
            name: "Espresso (Double Shot)",
            price: "$4.50",
            subtitle: "Rich, nutty, and chocolatey crema.",
            description:
              "Carefully dialed-in double shot of seasonal single-origin beans highlighting caramel, hazelnut, and citrus notes.",
            ingredients: ["Specialty Roast Single-Origin Espresso"],
          },
          {
            name: "Americano",
            price: "$5.00",
            subtitle: "Smooth and aromatic black coffee.",
            description:
              "Double shot of rich espresso poured over hot or iced filtered spring water for a clean, nuanced cup.",
            ingredients: ["Double Espresso", "Filtered Mountain Spring Water"],
          },
          {
            name: "Golden Turmeric Spice Latte",
            price: "$6.50",
            subtitle: "Healing anti-inflammatory elixir.",
            description:
              "Organic cold-pressed turmeric, ginger root, cinnamon, black pepper, and cardamom steamed with creamy oat milk and sweetened with local wildflower honey.",
            ingredients: [
              "Turmeric Root",
              "Fresh Ginger",
              "Steamed Oat Milk",
              "Wildflower Honey",
              "Warming Spices",
            ],
            tags: ["Wellness", "Vegan Option"],
          },
          {
            name: "Organic Tea Selection",
            price: "$5.00",
            subtitle: "Loose leaf teas steeped to precision.",
            description:
              "Choose from Organic Earl Grey, Moroccan Mint Green Tea, Jasmine Dragon Pearls, Chamomile Blossom, or Egyptian Rosehip.",
            ingredients: ["Single-Estate Loose Leaf Tea", "Pure Filtered Water"],
            tags: ["Organic"],
          },
        ],
      },
      {
        title: "Cold & refreshing coolers",
        items: [
          {
            name: "Fresh Squeezed Meyer Lemonade",
            price: "$5.50",
            subtitle: "Bright California sunshine in a glass.",
            description:
              "Locally sourced California Meyer lemons hand-squeezed daily with pure cane sugar and fresh garden mint sprig.",
            ingredients: ["Fresh Meyer Lemons", "Pure Cane Sugar", "Garden Mint"],
            tags: ["Refreshing"],
          },
          {
            name: "Beachwood Arnold Palmer",
            price: "$6.00",
            subtitle: "The canyon's favorite afternoon thirst quencher.",
            description:
              "Half housemade fresh Meyer lemonade and half organic black iced tea, served over crushed ice with a fresh lemon wheel.",
            ingredients: ["Fresh Lemonade", "Organic Black Tea", "Lemon Wheel"],
            tags: ["Popular"],
          },
          {
            name: "Iced Strawberry Hibiscus Spritz",
            price: "$6.50",
            subtitle: "Naturally sweet and tart sparkling cooler.",
            description:
              "Brewed ruby-red organic hibiscus tea layered with fresh crushed California strawberries, sparkling mineral water, and lime.",
            ingredients: [
              "Organic Hibiscus",
              "Crushed Strawberries",
              "Sparkling Water",
              "Fresh Lime",
            ],
            tags: ["Caffeine Free", "Refreshing"],
          },
          {
            name: "Fresh Squeezed Orange Juice",
            price: "$7.00",
            subtitle: "100% pure California Valencia oranges.",
            description:
              "Cold-pressed to order every morning. Pure, sweet, unpasteurized citrus juice packed with vitamin C.",
            ingredients: ["100% Fresh California Oranges"],
            tags: ["Fresh Pressed"],
          },
        ],
      },
    ],
  },
  {
    id: "beer-wine",
    title: "Beer & wine",
    service: "Available during applicable service hours",
    groups: [
      {
        title: "Artisan cocktails & wines by the glass / bottle",
        items: [
          {
            name: "Signature Craft Cocktails",
            price: "$15.00",
            image: "/images/cocktail.jpg",
            featured: true,
            subtitle: "Handcrafted Hollywood aperitifs & spritzes.",
            description:
              "Seasonal rotating cocktails including the Hollywood Hills Gin Fizz, Canyon Paloma with pink grapefruit, Spiced Mezcalita, and Smoked Bourbon Old Fashioned.",
            ingredients: [
              "Craft Spirits",
              "Fresh Citrus",
              "House Herb Syrups",
              "Artisan Bitters",
            ],
            tags: ["Mixologist Special", "House Favorite"],
          },
          {
            name: "Prosecco Superiore DOCG (Veneto, Italy)",
            price: "$14 / $52",
            subtitle: "Crisp, effervescent, and celebratory.",
            description:
              "Vibrant aromas of green apple, white peach, and jasmine blossoms with fine persistent bubbles and a remarkably clean, dry finish.",
            ingredients: ["100% Glera Grapes", "Veneto Region", "11% ABV"],
            tags: ["Bubbles"],
          },
          {
            name: "Sauvignon Blanc (Central Coast, CA)",
            price: "$15 / $56",
            subtitle: "Bright, zesty, and herbaceous.",
            description:
              "Crisp grapefruit, Meyer lemon curd, and fresh lemongrass notes supported by electric minerality and vibrant acidity.",
            ingredients: ["Central Coast Grapes", "Stainless Steel Fermented", "13.2% ABV"],
            tags: ["White Wine"],
          },
          {
            name: "Sonoma County Chardonnay (Sonoma, CA)",
            price: "$16 / $60",
            subtitle: "Silky, golden, and gently kissed by French oak.",
            description:
              "Layers of baked golden apple, ripe pear, crème brûlée, and subtle toasted brioche with a luxurious, lingering finish.",
            ingredients: ["Sonoma Coast Chardonnay", "French Oak Aged", "13.8% ABV"],
            tags: ["White Wine"],
          },
          {
            name: "Côtes de Provence Rosé (Provence, France)",
            price: "$15 / $56",
            subtitle: "Pale salmon, elegant, and refreshing.",
            description:
              "Delicate wild strawberries, white watermelon, and crushed sea stone. Perfectly crisp and refreshing in the canyon afternoon.",
            ingredients: ["Grenache & Cinsault Blend", "Provence, France", "12.5% ABV"],
            tags: ["Staff Pick", "Rosé"],
          },
          {
            name: "Willamette Valley Pinot Noir (Oregon)",
            price: "$17 / $64",
            subtitle: "Silky, earthy, and aromatic.",
            description:
              "Ripe Bing cherry, wild forest raspberry, hints of cedar wood, and warming spice with velvety soft tannins and a supple finish.",
            ingredients: ["Willamette Valley Pinot Noir", "French Oak Casks", "13.5% ABV"],
            tags: ["Featured Red"],
          },
          {
            name: "Paso Robles Cabernet Sauvignon (California)",
            price: "$16 / $60",
            subtitle: "Rich, bold, and velvety smooth.",
            description:
              "Lush dark blackberries, cassis, dark Dutch cocoa, and sweet tobacco notes framed by structured, polished tannins.",
            ingredients: ["Paso Robles Cabernet", "Aged 14 Months Oak", "14.2% ABV"],
            tags: ["Red Wine"],
          },
        ],
      },
      {
        title: "Craft beers & ciders",
        items: [
          {
            name: "Local Los Angeles Hazy IPA",
            price: "$9.00",
            subtitle: "Juicy, citrus-forward local draft.",
            description:
              "Brewed right here in Southern California. Packed with Citra and Mosaic hops delivering bursts of ripe mango, passionfruit, and sweet pine resin.",
            ingredients: ["Locally Brewed IPA", "Citra & Mosaic Hops", "6.8% ABV"],
            tags: ["Craft Beer"],
          },
          {
            name: "Golden Valley Bavarian Pilsner",
            price: "$8.00",
            subtitle: "Crisp, clean, and endlessly refreshing.",
            description:
              "Traditional German lager brewing technique using Bavarian malts and noble Hallertau hops. Wonderfully crisp and refreshing.",
            ingredients: ["Bavarian Pilsner Malt", "Hallertau Hops", "5.1% ABV"],
            tags: ["Draft"],
          },
          {
            name: "Echigo Japanese Rice Lager",
            price: "$9.00",
            subtitle: "Super dry and exceptionally clean.",
            description:
              "Brewed with premium Niigata Koshihikari rice for a light, dry, and crisp profile that cleanses the palate beautifully.",
            ingredients: ["Koshihikari Rice", "Light Malt", "5.0% ABV"],
            tags: ["Import"],
          },
          {
            name: "Stem Organic Crisp Apple Cider",
            price: "$9.00",
            subtitle: "Naturally gluten-free and sparkling.",
            description:
              "Crafted from 100% freshly pressed organic heirloom apples. Tart, dry, lightly bubbly, and zero added sugars.",
            ingredients: ["Fresh Pressed Heirloom Apples", "Gluten-Free", "5.8% ABV"],
            tags: ["Gluten-Free", "Cider"],
          },
        ],
      },
    ],
  },
];
