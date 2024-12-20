local bot = getBot()
local json = require("json")
local configFilePath = "config.json"

local modeTile = {-1, 0, 1}
local tileToBreak = {}
local tileToPath = {}
local warpState = ""

-- Function to read and decode JSON from a file
local function jsonRead(filePath)
    local file, err = io.open(filePath, "r")
    if not file then
        print("Error opening file: " .. err)
        return nil
    end

    local content = file:read("*a")
    file:close()

    local decodedContent, decodeErr = json.decode(content)
    if not decodedContent then
        print("Error decoding JSON: " .. decodeErr)
        return nil
    end

    return decodedContent
end

-- Function to find an item in the bot's inventory
local function findItem(itemId)
    return bot:getInventory():findItem(itemId) or 0
end

-- Function to place an item at a specific position
local function place(itemId, x, y)
    return bot:place(bot.x + x, bot.y + y, itemId)
end

-- Function to punch a tile at a specific position
local function punch(x, y)
    return bot:hit(bot.x + x, bot.y + y)
end

-- Function to check if a tile should be punched
local function iteratePunch(x, y)
    for _, num in ipairs(tileToBreak) do
        if getTile(x + num, y).fg == farming.item_id then
            return true
        end
    end
    return false
end

-- Function to check if a tile should be placed
local function iteratePlace(x, y)
    for _, num in ipairs(tileToPath) do
        if getTile(x + num, y).fg == 0 then
            return true
        end
    end
    return false
end

-- Function to scan a tile for a specific item
local function scanTile(itemId)
    return bot:getWorld().growscan:getTiles()[itemId] or 0
end

-- Function to scan floating objects for a specific item
local function scanFloat(itemId)
    return bot:getWorld().growscan:getObjects()[itemId] or 0
end

-- Function to read and update farm data from a file
local function farmRead(fileName)
    local file, err = io.open(fileName, "r")
    if not file then
        print("Error opening file: " .. err)
        return "", ""
    end

    local lines = {}
    for line in file:lines() do
        table.insert(lines, line)
    end
    file:close()

    local firstLine = lines[1]
    local world, door = "", ""
    if firstLine then
        world, door = firstLine:match("([^|]*)|?(.*)")
        table.remove(lines, 1)
    end

    file, err = io.open(fileName, "w")
    if not file then
        print("Error opening file for writing: " .. err)
        return world, door
    end

    for _, line in ipairs(lines) do
        file:write(line .. "\n")
    end
    if firstLine then
        file:write(firstLine .. "\n")
    end
    file:close()

    return world, door
end

-- Function to show logs in the console
local function consoleLog(message)
    bot.custom_status = message
    bot:getConsole:append('`o' .. message)
end

-- Function to check if tile can be dropped
local function tileNotMax(x, y)
    local totalCount = 0
    local totalStack = 0
    local objects = getObjects()

    for _, obj in ipairs(objects) do
        local objX = math.floor((obj.x + 10) / 32)
        local objY = math.floor((obj.y + 10) / 32)
        
        if objX == x and objY == y then
            totalCount = totalCount + obj.count
            totalStack = totalStack + 1
        end
    end

    return totalStack < 20 and totalCount <= (4000 - num)
end

-- Function to send message to a Discord webhook
local function sendWebhook(link, message)
    local webhook = Webhook.new(link)
    webhook.content = message
    webhook:send()
end

-- Function to buy clothes from the shop
local function buyClothes()
    local clothes = {}

    for _, item in ipairs(bot:getInventory():getItems()) do
        local itemInfo = getInfo(item.id)
        if itemInfo and itemInfo.clothing_type ~= 0 then
            table.insert(clothes, item.id)
        end
    end

    if #clothes >= 20 then
        return false
    end

    consoleLog("[CLOTHES] BUYING CLOTHES")
    bot:buy("rare_clothes")
    sleep(2000)

    for _, item in ipairs(bot:getInventory():getItems()) do
        local itemInfo = getInfo(item.id)
        if itemInfo and itemInfo.clothing_type ~= 0 and (item.id ~= 3934 and item.id ~= 3932) then
            bot:wear(item.id)
            sleep(1000)
        end
    end

    return true
end

-- Function to wait until bot is online
local function awaitConnection()
    while bot.status ~= BotStatus.online do
        sleep(1000)
        if bot.google_status == 3 or bot.google_status == 7 then
            bot:connect()
            sleep(1000)
        end
        if bot.status == BotStatus.account_banned then
            bot:stopScript()
        end
    end
end

-- Function to send world status to a Discord webhook
local function worldInfo(link, message)
    local webhook = Webhook.new(link)
    webhook.content = message
    webhook:send()
end

-- Function to check warp status
local function OnWorldState(var, netid)
    if variant:get(0):getString() == "OnConsoleMessage" then
        if var:get(1):getString():lower():find("inaccessible") or
            var:get(1):getString():lower():find("lower") or
            var:get(1):getString():lower():find("banned") or
            var:get(1):getString():lower():find("tomorrow")
        then
            warpState = var:get(1):getString()
            isNuked = true
            unlistenEvents()
        end
    end
end

-- Function to warp to a specific world
local function warp(world,door,checkDoor,checkTile)
    if world == "" or world == nil then
        infoWorld(farming.webhook.world, "World is undefined")
        isNuked = true
        return
    end

    isNuked = false
    isInvalid = false

    local retry = 0
    addEvent(Event.variantlist, OnWorldState)

    consoleLog("[WARP] ENTERING WORLD")

    while not bot:isInWorld(world) and not isNuked then
        if bot.status == BotStatus.online and bot:getPing() == 0 then
            bot:disconnect()
            sleep(1000)
        end
        awaitConnection()
        sleep(100)
        if door == "" then
            bot:warp(world)
        else
            bot:warp(world, door)
        end
        listenEvents(10)
        sleep(farming.interval.warp)
        if retry == 5 and not bot:isInWorld(world) then
            consoleLog("[WARP] FAILED ENTERING")
            sleep(100)
            while bot.status == BotStatus.online do
                bot:disconnect()
                bot.auto_reconnect = false
                sleep(100)
            end
            sleep(30000)
            bot.auto_reconnect = true
        else
            retry = retry + 1
        end
    end
    if door ~= "" and getTile(bot.x, bot.y).fg == 6 and not isNuked then
        retry = 0
        while getTile(bot.x, bot.y).fg == 6 and not isInvalid do
            awaitConnection()
            sleep(100)
            bot:warp(world, door)
            sleep(5000)
            if retry == 5 and getTile(bot.x, bot.y).fg == 6 then
                consoleLog("[WARP] FAILED ENTERING")
                sleep(100)
                while bot.status == BotStatus.online do
                    bot:disconnect()
                    bot.auto_reconnect = false
                    sleep(100)
                end
                sleep(30000)
                bot.auto_reconnect = true
            else
                retry = retry + 1
            end
        end