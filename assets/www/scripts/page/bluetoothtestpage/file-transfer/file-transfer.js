
function FileTransferTag() {
    return {
        // initialize the element's model
        ready: function() {
            console.log("file transfer ready")
            this.fileTransferManager = SyncFileTransferManager.getInstance()
            this.fileTransferManager.addObserver(this)
            this.state = this.fileTransferManager.getState()
            this.stateString = this.stringForState(this.state)
            this.devices = this.fileTransferManager.getDevices()
            this.folderListing = undefined
            this.waitingForRequest = false
            this.pageData = undefined
            this.canvas = this.$.canvas
            this.canvasContext = this.canvas.getContext('2d')
        },
        connect: function(event, detail, sender) {
            var device = sender.templateInstance.model.device
            this.fileTransferManager.connect(device.address)
        },
        disconnect: function(event, detail, sender) {
            var device = sender.templateInstance.model.device
            this.folderListing = undefined
            this.fileTransferManager.disconnect(device.address)
        },
        parentFolder: function() {
            this.fileTransferManager.changeFolder(this.devices[0], '..')
            this.waitingForRequest = true
        },
        rootFolder: function() {
            this.fileTransferManager.changeFolder(this.devices[0], '')
            this.waitingForRequest = true
        },
        listFolder: function() {
            this.fileTransferManager.listFolder(this.devices[0])
            this.waitingForRequest = true
        },
        getFile: function(event, detail, sender) {
            var file = sender.templateInstance.model.file
            this.fileTransferManager.getFile(this.devices[0], file.name)
            this.waitingForRequest = true
        },
        deleteFile: function(event, detail, sender) {
            var file = sender.templateInstance.model.file
            this.fileTransferManager.deleteFile(this.devices[0], file.name)
            this.waitingForRequest = true
        },
        changeFolder: function(event, detail, sender) {
            var folder = sender.templateInstance.model.folder
            this.fileTransferManager.changeFolder(this.devices[0], folder.name)
            this.waitingForRequest = true
        },
        stateChanged : function(oldState, newState) {
            this.stateString = this.stringForState(newState)
            this.state = newState
        },
        updatedDevices: function() {
            this.devices = this.fileTransferManager.getDevices()
        },
        listedFolder: function(folderListing) {
            this.folderListing = folderListing
            this.waitingForRequest = false
        },
        changedFolder: function() {
            this.fileTransferManager.listFolder(this.devices[0])
        },
        gotFile: function(file) {
            this.waitingForRequest = false
            this.pageData = file

            // Render the PDF.
            PDFJS.getDocument(this.pageData).then(function(pdf) {
                pdf.getPage(1).then(function(page) {
                    var viewport = page.getViewport(1.0)
                    var fileTransferTag = document.querySelector('file-transfer-tag');
                    page.render({
                        canvasContext: fileTransferTag.canvasContext,
                        viewport: viewport
                    })
                })
            })
        },
        deletedFile: function(file) {
            this.fileTransferManager.listFolder(this.devices[0])
        },
        stringForState: function(state) {
            var states = this.fileTransferManager.states
            switch(state) {
                case states.CONNECTED:
                    return 'Connected'
                case states.DISCONNECTED:
                    return 'Disconnected'
                case states.CONNECTING:
                    return 'Connecting'
                case states.DISCONNECTING:
                    return 'Disconnecting'
            }
            return 'N/A'
        }
    };
}
