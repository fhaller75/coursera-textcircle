this.Documents = new Mongo.Collection("documents");
EditingUsers = new Mongo.Collection("editingUsers");

if (Meteor.isClient){

    Template.editor.helpers({
        docid:function(){
            // console.log("In docid editor helper");
            var doc = Documents.findOne();
            if (doc){
                return doc._id;
            }
            else {
                return undefined;
            }
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


    ////////////
    /// EVENTS
    ////////////

    Template.navbar.events({
        "click .js-add-doc":function(event){
            event.preventDefault();
            console.log("Add a new doc!");
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
}

Meteor.methods({
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
    }
})
