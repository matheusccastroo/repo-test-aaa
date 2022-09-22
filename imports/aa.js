// set up
var coll1 = new Mongo.Collection('coll1');
var coll2 = new Mongo.Collection('coll2');

if (Meteor.isServer) {
  coll1.remove({});
  coll1.insert({ _id: '1', a: 1, b: 1 });

  coll2.remove({});
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test 1
Meteor.methods({
  async 'test1'() {
    coll1.update({ _id: '1' }, { $inc: { a: 1 } });

    await sleep(100);
  }
});

Test1 = function () {
  Tracker.autorun(() => {
    const doc = coll1.findOne({ _id: '1' });
    console.log('a', doc.a, 'b', doc.b);
  });

  Meteor.callAsync('test1').then(() => {
    // If coll1.update thinks it is inside of a method stub, the change will be
    // reverted when the client receives the server result for the method
    coll1.update({ _id: '1' }, { $inc: { b: 1 } });
  }).then(() => {
    console.log('method finished - both a and b should be increased by "1"');
  });


}

// Test 2
Meteor.methods({
  async create() {
    await sleep(50);
    coll2.remove({});
    coll2.insert({});
    coll2.insert({});
    coll2.insert({});
  },
  async nothing() {
    await sleep(500);
  }
});

Test2 = async function () {
  Tracker.autorun(() => {
    let docs = coll2.find({}, { fields: { _id: 1 } }).fetch();
    if (docs.length > 0) {
      console.log('test 2 - coll2 ids', docs);
    }
  });

  await Meteor.callAsync('create');
  await Meteor.callAsync('nothing');

  console.log('test 2 finished - "test 2 - coll2 ids" should only have logged once');
}
