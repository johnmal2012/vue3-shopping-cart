import express from 'express';
import { MongoClient } from 'mongodb';
import path from 'path';
// import {
//   cartItems as cartItemsRaw,
//   products as productsRaw,
// } from './temp-data';

// let cartItems = cartItemsRaw;
// let products = productsRaw;

async function start() {
  const url = `mongodb+srv://johnmal:jajaaa92@cluster0.px1iz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
  const client = new MongoClient(url);

  await client.connect();
  const db = client.db('vue3-db');

  const app = express();
  app.use(express.json());

  app.use('/images', express.static(path.join(__dirname, '../assets')));

  app.use(
    express.static(
      path.resolve(__dirname, '../dist'),
      { maxAge: '1y', etag: false }
      // Sets the Cache-Control header, specifying that the browser can cache these files for 1 year
      // etag: A unique identifier for a file, used by the browser to check if the file has changed;
      // disabling it is useful in scenarios where caching is heavily relied upon, and no server-side validation of file changes is needed.
    )
  );

  //   app.get('/hello', (req, res) => {
  //     res.send('Hello!');
  //   });

  //   app.get('/products', (req, res) => {
  //     res.json(products);
  //   });

  //   function populateCartIds(ids) {
  //     return ids.map((id) => products.find((product) => product.id === id));
  //   }

  //   app.get('/cart', (req, res) => {
  //     const populatedCart = populateCartIds(cartItems);
  //     res.json(populatedCart);
  //   });

  //   app.get('/products/:productId', (req, res) => {
  //     const productId = req.params.productId;
  //     const product = products.find((product) => product.id === productId);
  //     res.json(product);
  //   });

  //   app.post('/cart', (req, res) => {
  //     const productId = req.body.id;
  //     cartItems.push(productId);
  //     const populatedCart = populateCartIds(cartItems);
  //     res.json(populatedCart);
  //   });

  //   app.delete('/cart/:productId', (req, res) => {
  //     const productId = req.params.productId;
  //     cartItems = cartItems.filter((id) => id !== productId);
  //     const populatedCart = populateCartIds(cartItems);
  //     res.json(populatedCart);
  //   });

  //   app.get('/products', async (req, res) => {
  //     const products = await db.collection('products').find({}).toArray();
  //     res.send(products);
  //   });

  //   async function populateCartIds(ids) {
  //     return Promise.all(
  //       ids.map((id) => db.collection('products').findOne({ id }))
  //     );
  //   }

  //   app.get('/users/:userId/cart', async (req, res) => {
  //     const user = await db
  //       .collection('users')
  //       .findOne({ id: req.params.userId });
  //     const populatedCart = await populateCartIds(user?.cartItems || []);
  //     res.json(populatedCart);
  //   });

  //   app.get('/products/:productId', async (req, res) => {
  //     const productId = req.params.productId;
  //     const product = await db.collection('products').findOne({ id: productId });
  //     res.json(product);
  //   });

  //   app.post('/users/:userId/cart', async (req, res) => {
  //     const userId = req.params.userId;
  //     const productId = req.body.id;

  //     await db.collection('users').updateOne(
  //       { id: userId },
  //       {
  //         $addToSet: { cartItems: productId },
  //       }
  //     );

  //     const user = await db
  //       .collection('users')
  //       .findOne({ id: req.params.userId });
  //     const populatedCart = await populateCartIds(user?.cartItems || []);
  //     res.json(populatedCart);
  //   });

  //   app.delete('/users/:userId/cart/:productId', async (req, res) => {
  //     const userId = req.params.userId;
  //     const productId = req.params.productId;

  //     await db.collection('users').updateOne(
  //       { id: userId },
  //       {
  //         $pull: { cartItems: productId },
  //       }
  //     );

  //     const user = await db
  //       .collection('users')
  //       .findOne({ id: req.params.userId });
  //     const populatedCart = await populateCartIds(user?.cartItems || []);
  //     res.json(populatedCart);
  //   });

  app.get('/api/products', async (req, res) => {
    const products = await db.collection('products').find({}).toArray();
    res.send(products);
  });

  async function populateCartIds(ids) {
    return Promise.all(
      ids.map((id) => db.collection('products').findOne({ id }))
    );
  }

  app.get('/api/users/:userId/cart', async (req, res) => {
    const user = await db
      .collection('users')
      .findOne({ id: req.params.userId });
    const populatedCart = await populateCartIds(user?.cartItems || []);
    res.json(populatedCart);
  });

  app.get('/api/products/:productId', async (req, res) => {
    const productId = req.params.productId;
    const product = await db.collection('products').findOne({ id: productId });
    res.json(product);
  });

  app.post('/api/users/:userId/cart', async (req, res) => {
    const userId = req.params.userId; // need to use express.json()
    const productId = req.body.id; // need to use express.json()

    const existingUser = await db.collection('users').findOne({ id: userId });

    if (!existingUser) {
      await db.collection('users').insertOne({ id: userId, cartItems: [] });
    }

    await db.collection('users').updateOne(
      { id: userId },
      {
        $addToSet: { cartItems: productId },
      }
    );

    const user = await db
      .collection('users')
      .findOne({ id: req.params.userId });
    const populatedCart = await populateCartIds(user?.cartItems || []);
    res.json(populatedCart);
  });

  app.delete('/api/users/:userId/cart/:productId', async (req, res) => {
    const userId = req.params.userId;
    const productId = req.params.productId;

    await db.collection('users').updateOne(
      { id: userId },
      {
        $pull: { cartItems: productId },
      }
    );

    const user = await db
      .collection('users')
      .findOne({ id: req.params.userId });
    const populatedCart = await populateCartIds(user?.cartItems || []);
    res.json(populatedCart);
  });

  // redirect to index.html if request not handled by api endpoints
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });

  const port = process.env.PORT || 8000;

  app.listen(port, () => {
    console.log('Server is listening on port ' + port);
  });
}

start();
