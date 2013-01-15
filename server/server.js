Meteor.publish("directory", function () {
  return Meteor.users.find({}, {fields: {emails: 1, profile: 1}});
});
Meteor.publish("containrs", function () {
  return Containrs.find({});
});
// Meteor.publish("userData", function () {
//   return Meteor.users.find({});
// });