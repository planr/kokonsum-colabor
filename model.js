Containrs = new Meteor.Collection("containrs");

var attending = function (containr) {
  return (_.groupBy(containr.rsvps, 'rsvp').yes || []).length;
};

Meteor.methods({
  // options should include: title, description, x, y, public
  createContainr: function (options) {
    options = options || {};
    if (! (typeof options.title === "string" && options.title.length &&
           typeof options.description === "string" &&
           options.description.length &&
           typeof options.x === "number" && options.x >= 0 && options.x <= 1 &&
           typeof options.y === "number" && options.y >= 0 && options.y <= 1))
      throw new Meteor.Error(400, "Daten fehlen");
    if (options.title.length > 100)
      throw new Meteor.Error(413, "Dieser Titel ist zu lang");
    if (options.description.length > 1000)
      throw new Meteor.Error(413, "Beschreibung ist zu lang");
    if (! this.userId)
      throw new Meteor.Error(403, "Du musst angemeldet sein");

    return Containrs.insert({
      owner: this.userId,
      x: options.x,
      y: options.y,
      title: options.title,
      description: options.description,
      public: !! options.public,
      invited: [],
      rsvps: []
    });
  }
  });

///////////////////////////////////////////////////////////////////////////////
// Users

var displayName = function (user) {
  if (user.profile && user.profile.name)
    return user.profile.name;
  return user.emails[0].address;
};
var displayMailer = function (user) {
  if (user.profile && user.profile.name)
    return user.profile.name;
  return user.emails[0].address;
};

var contactEmail = function (user) {
  if (user.emails && user.emails.length)
    return user.emails[0].address;
  if (user.services && user.services.facebook && user.services.facebook.email)
    return user.services.facebook.email;
  return null;
};