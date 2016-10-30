
Meteor.subscribe("documents");
Meteor.subscribe("editingUsers");

Router.configure({
  layoutTemplate: 'ApplicationLayout'
});

Router.route('/', function(){
  console.log("You hit /");
  this.render("navbar", {to:"header"})
  this.render("docList", {to:"main"})
});

Router.route('/document/:_id', function(){
  console.log("You hit /document "+this.params._id);
  Session.set("docid", this.params._id)
  this.render("navbar", {to:"header"})
  this.render("docItem", {to:"main"})
});

Template.editor.helpers({
    docid:function(){
        setupCurrentDocument();
        return Session.get("docid");
    },
    config:function(){
        // console.log("In config editor helper");
        return function(editor){
            editor.setOption("lineNumbers", true);
            editor.setOption("theme", "cobalt");
            // editor.setOption("mode", "html");
            editor.on("change", function(cm_editor, info){
                // console.log(cm_editor.getValue());
                $("#viewer_iframe").contents().find("html").html(cm_editor.getValue());
                Meteor.call("addEditingUser", Session.get("docid"));
            });
        }
    }
});

Template.editingUsers.helpers({
    users:function(){
        var doc, eusers, users;
        doc = Documents.findOne({_id:Session.get("docid")});
        if  (!doc){return;}
        eusers = EditingUsers.findOne({docid:doc._id});
        if  (!eusers){return;}
        users = new Array();
        var i = 0;
        for (var user_id in eusers.users){
            users[i] = eusers.users[user_id];
            i++;
        }
        return users;
    }
})

Template.navbar.helpers({
    documents:function(){
        return Documents.find();
    }
})

Template.docList.helpers({
    documents:function(){
        return Documents.find();
    }
})

Template.docMeta.helpers({
    document:function(){
        return Documents.findOne({_id:Session.get("docid")});
    },
    canEdit:function(){
        var doc;
        doc = Documents.findOne({_id:Session.get("docid")});
        if (doc){
            if (doc.owner == Meteor.userId()){
                return true;
            }
        }
        return false;
    }
})

Template.editableText.helpers({
    userCanEdit:function(doc,Collection){
        // user can edit if owns the doc
        // console.log(this.context);
        // console.log("user:"+Meteor.userId());
        return this.context.owner === Meteor.userId();
    }
})

////////////
/// EVENTS
////////////

Template.navbar.events({
    "click .js-add-doc":function(event){
        event.preventDefault();
        if (!Meteor.user()){ // user not logged in
            alert("Please login to create a document.");
        }
        else { // user is logged in => create doc
            var id = Meteor.call("addDoc", function(err, res){
                if (!err){ // all good
                    console.log("click event callback: got id "+res);
                    Session.set("docid", res);
                }
            });
        }
    },
    "click .js-load-doc":function(event){
        console.log(this);
        Session.set("docid", this._id);
    }
})

Template.docMeta.events({
    "click .js-tog-private":function(event){
        // console.log(event.target.checked);
        var doc = {_id:Session.get("docid"), isPrivate:event.target.checked};
        Meteor.call("updateDocPrivacy", doc);
    }    
})

function setupCurrentDocument(){
    var doc;
    if (!Session.get("docid")){ // no doc is set yet
        doc = Documents.findOne();
        if (doc){
            Session.set("docid", doc._id);
        }
    }
}

