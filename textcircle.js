this.Documents = new Mongo.Collection("documents");
EditingUsers = new Mongo.Collection("editingUsers");

if (Meteor.isClient){

    Meteor.subscribe("documents");
    Meteor.subscribe("editingUsers");

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
                    Meteor.call("addEditingUsers");
                });
            }
        }
    });

    Template.editingUsers.helpers({
        users:function(){
            var doc, eusers, users;
            doc = Documents.findOne();
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

} // end isClient

if (Meteor.isServer){
	Meteor.startup(function(){
		// code to run on server at startup
        if (!Documents.findOne()){
            Documents.insert({title:"my new document"})
        }
	});

    Meteor.publish("documents", function(){
        return Documents.find({
            $or:[
                {isPrivate:false},
                {owner:this.userId}
                ]
        });
    });
    Meteor.publish("editingUsers", function(){
        return EditingUsers.find();
    });
}

Meteor.methods({
    addDoc:function(){
        var doc;
        if (!this.userId){ // user not logged in
            return;
        }
        else {
            doc = {owner:       this.userId,
                   createdOn:   new Date(),
                   title:       "untitled document"};
            var id = Documents.insert(doc);
            console.log("addDoc method: got id "+id);
            return id;
        }
    },
    addEditingUsers:function(){
        var doc, user, eusers;
        doc = Documents.findOne();
        if (!doc) {return;}
        if (!this.userId) {return;}
        user = Meteor.user().profile;
        eusers = EditingUsers.findOne({docid:doc._id});
        if (!eusers){
            eusers = {
                docid:doc._id,
                users:{},
            };
        }
        user.lastEdit = new Date();
        eusers.users[this.userId] = user;

        EditingUsers.upsert({_id:eusers._id}, eusers);
    },
    updateDocPrivacy:function(doc){
        console.log("method updateDocPrivacy");
        console.log(doc);
        var realdoc = Documents.findOne({_id:doc._id, owner:this.userId});
        if (realdoc){
            realdoc.isPrivate = doc.isPrivate;
            Documents.update({_id:doc._id}, realdoc);
        }
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

