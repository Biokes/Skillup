module testPush::testPush{
    use std::string::String;

    public struct Player has copy, drop, key{
        id: ID;
        name: String;
    }

}

