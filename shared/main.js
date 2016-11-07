
Meteor.methods({
    addComment:function(comment){
        console.log("method: addComment");
        if (this.userId){
            comment.owner = this.userId;
            comment.createdOn = new Date();
            return Comments.insert(comment);
        }
        return;
    },
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
    addEditingUser:function(docid){
        var doc, user, eusers;
        doc = Documents.findOne({_id:docid});
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

