const CopyDB = {
    MultiResponseToObject : function (mg) {
        return mg.map(mg => mg.toObject());
    },
    SingleResponseToObject: function (mg) {
        return mg ? mg.toObject() : mg ;
    },
};

export default CopyDB