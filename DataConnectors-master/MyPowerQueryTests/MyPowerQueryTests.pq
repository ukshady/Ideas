// This file contains your Data Connector logic
[Version = "1.0.0"]
section MyPowerQueryTests;

[DataSource.Kind="MyPowerQueryTests", Publish="MyPowerQueryTests.Publish"]
shared MyPowerQueryTests.Contents = (optional message as text) =>
let
    response= Web.Contents(
        "http://blackpi:8080/data/aircraft.json"
        ),
jsonResponse = Json.Document(response)
in
    jsonResponse 

// Data Source Kind description
MyPowerQueryTests = [
    Authentication = [
        // Key = [],
        // UsernamePassword = [],
        // Windows = [],
        Anonymous = []
    ]
];

// Data Source UI publishing description
MyPowerQueryTests.Publish = [
    Beta = true,
    Category = "Other",
    ButtonText = { Extension.LoadString("ButtonTitle"), Extension.LoadString("ButtonHelp") },
    LearnMoreUrl = "https://powerbi.microsoft.com/",
    SourceImage = MyPowerQueryTests.Icons,
    SourceTypeImage = MyPowerQueryTests.Icons
];

MyPowerQueryTests.Icons = [
    Icon16 = { Extension.Contents("MyPowerQueryTests16.png"), Extension.Contents("MyPowerQueryTests20.png"), Extension.Contents("MyPowerQueryTests24.png"), Extension.Contents("MyPowerQueryTests32.png") },
    Icon32 = { Extension.Contents("MyPowerQueryTests32.png"), Extension.Contents("MyPowerQueryTests40.png"), Extension.Contents("MyPowerQueryTests48.png"), Extension.Contents("MyPowerQueryTests64.png") }
];
