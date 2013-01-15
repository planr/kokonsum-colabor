
Meteor.subscribe("directory");
Meteor.subscribe("containrs");

Meteor.startup(function () {
  Meteor.autorun(function () {
    if (! Session.get("selected")) {
      var containr = Containrs.findOne();
      if (containr)
        Session.set("selected", containr._id);
    }
  });
});

///////////////////////////////////////////////////////////////////////////////
// Details display

Template.details.korb = function () {
  return Containrs.findOne(Session.get("selected"));
};

Template.details.anyContainr = function () {
  return Containrs.find().count() > 0;
};

Template.details.creatorName = function () {
  var owner = Meteor.users.findOne(this.owner);
  if (owner._id === Meteor.userId())
    return "mir ( "+displayName(owner)+" )";
  return displayName(owner);
};

///////////////////////////////////////////////////////////////////////////////
// Navigation admin functions display or not, simple way
Template.nav.displclass = function () {
  var myUser = JSON.stringify(Meteor.user().emails);
  if (myUser != '[{"address":"ralf@plan-r.de","verified":false}]') {
    var displClass = "none";
      return displClass;
  };
};

///////////////////////////////////////////////////////////////////////////////
// List display

  Template.ctr.korb = function () {
    var allContainrs = Containrs.find({}).fetch();
      if ( Containrs.find().count() > 0){
            Session.set("werte", allContainrs); 
        }
      else {
            Session.set("werte");
      }
    return Session.get("werte");
  };


///////////////////////////////////////////////////////////////////////////////
// Event handling


  Template.nav.events({
    'click a.show' : function () {

      var allContainrs = Containrs.find({}).fetch();
      if ( Containrs.find().count() > 0){
            Session.set("werte", allContainrs); 
        }
      else {
            Session.set("werte");
      }
    },
    'click a.del' : function () {
      Containrs.remove({});
       // Session.set("werte");
    },
    'click a.add' : function (){
      Containrs.insert(
{ "owner" : Meteor.userId(), "x" : Math.random(), "y" : Math.random(), "title" : "Aldi Nippes", "description" : "5 Päckchen Gouda in Scheiben 400g", "public" : true, "invited" : [ ], "rsvps" : [ ] });
Containrs.insert(
{ "owner" : Meteor.userId(), "x" : Math.random(), "y" : Math.random(), "title" : "Aldi Marienstrasse", "description" : "1 Karton Zwiebel", "public" : true, "invited" : [ ], "rsvps" : [ ]});
Containrs.insert(
{ "owner" : Meteor.userId(), "x" : Math.random(), "y" : Math.random(), "title" : "Aldi Grüner Weg", "description" : "5 Pakete Vollkorn-Kekse mit Schoko", "public" : true, "invited" : [ ], "rsvps" : [ ] });


    },
    // 'click a.addDialog'  : function (){
    //   Session.set("showCreateDialog", true)
    // }
  });

Template.createDialog.events({
  'click .cancel': function () {
    $('#addModal').modal('toggle');
    // Session.set("showCreateDialog", false);
  },
  'click .save' : function (event, template){
    var title = template.find(".title").value;
    var description = template.find(".description").value;
    var public = ! template.find(".private").checked;
    var coords =Session.get("coords");
    $('#addModal').modal('toggle');
    if (title.length && description.length) {
      Meteor.call('createContainr', {
        title: title,
        description: description,
        x: coords.x,
        y: coords.y,
        public: true
      },
      function (error, containr) {
        if (! error) {
          Session.set("selected", containr);
          // if (! public && Meteor.users.find().count() > 1)
            // openInviteDialog();
        }
      });
      template.find(".description").value = "";
      template.find(".title").value = "";
    }
  }
});

///////////////////////////////////////////////////////////////////////////////
// Map display

// Use jquery to get the position clicked relative to the map element.
var coordsRelativeToElement = function (element, event) {
  var offset = $(element).offset();
  var x = event.pageX - offset.left;
  var y = event.pageY - offset.top;
  return { x: x, y: y };
};

Template.map.events({
  'mousedown circle, mousedown text': function (event, template) {
    Session.set("selected", event.currentTarget.id);
  },
  'dblclick .map': function (event, template) {
    if (! Meteor.userId()) // must be logged in to create events
      return;
    var coords = coordsRelativeToElement(event.currentTarget, event);
    // openCreateDialog(coords.x / 480, coords.y / 480);
    Session.set("coords", { x: (coords.x / 480), y: (coords.y / 480) });
    $('#addModal').modal('toggle');
  }
});

Template.map.rendered = function () {
  var self = this;
  self.node = self.find("svg");
  if (! self.handle) {
    self.handle = Meteor.autorun(function () {
      var selected = Session.get('selected');
      var selectedContainr = selected && Containrs.findOne(selected);
      var radius = function (containr) {
        return 10 + Math.sqrt(attending(containr)) * 10;
      };

      // Draw a circle for each party
      var updateCircles = function (group) {
        group.attr("id", function (containr) { return containr._id; })
        .attr("cx", function (containr) { return containr.x * 480; })
        .attr("cy", function (containr) { return containr.y * 480; })
        .attr("r", radius)
        .attr("class", function (containr) {
          return containr.public ? "public" : "private";
        })
        .style('opacity', function (containr) {
          return selected === containr._id ? 1 : 0.6;
        });
      };

      var circles = d3.select(self.node).select(".circles").selectAll("circle")
        .data(Containrs.find().fetch(), function (containr) { return containr._id; });

      updateCircles(circles.enter().append("circle").transition());
      updateCircles(circles.transition().duration(1550).ease("elastic"));
      circles.exit().transition().duration(250).attr("r", 0).remove();

      // Label each with the current attendance count
      var updateLabels = function (group) {
        group.attr("id", function (containr) { return containr._id; })
        .text(function (containr) {return attending(containr) || '';})
        .attr("x", function (containr) { return containr.x * 480; })
        .attr("y", function (containr) { return containr.y * 480 + radius(containr)/2 })
        .style('font-size', function (containr) {
          return radius(containr) * 1.25 + "px";
        });
      };

      var labels = d3.select(self.node).select(".labels").selectAll("text")
        .data(Containrs.find().fetch(), function (containr) { return containr._id; });

      updateLabels(labels.enter().append("text"));
      updateLabels(labels.transition().duration(250).ease("cubic-out"));
      labels.exit().remove();

      // Draw a dashed circle around the currently selected party, if any
      var callout = d3.select(self.node).select("circle.callout")
        .transition().duration(250).ease("cubic-out");
      if (selectedContainr)
        callout.attr("cx", selectedContainr.x * 480)
        .attr("cy", selectedContainr.y * 480)
        .attr("r", radius(selectedContainr) + 10)
        .attr("class", "callout")
        .attr("display", '');
      else
        callout.attr("display", 'none');
    });
  }
};
Template.map.destroyed = function () {
  this.handle && this.handle.stop();
};

