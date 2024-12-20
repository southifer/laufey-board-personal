bot = getBot()
json = require("json")
config = "C:\\Users\\Administrator\\Desktop\\config.json"

for i, botz in pairs(getBots()) do
    if botz.name:upper() == bot.name:upper() then
        indexBot = i
    end
end

bot.collect_range = 4
bot.collect_interval = 150

mode3Tile = {-1,0,1}
tileBreak = {}
tilePath = {}
storageIndex = 1
warpStatus = ""
switchBreak = 1
itemToWear = {818, 496}

local JSON = {
    content = function(self, path)
        queryInsert("[JSON] TRYING TO READ JSON")
        local file = io.open(path, 'r')
        if not file then
            queryInsert("[JSON] COULD NOT OPEN FILE: " .. path)
            return false, 'Could not open file: ' .. path
        end

        queryInsert("[JSON] READING JSON DATA")
        local data = file:read('*a')
        file:close()

        local response, _, err = json.decode(data)
        if err then
            queryInsert("[JSON] INVALID JSON FORMAT: " .. err)
            return false, 'Invalid JSON format: ' .. err
        end

        queryInsert("[JSON] SUCCESSFULLY READ JSON")
        return response
    end
}

function findItem(id)
    return bot:getInventory():findItem(id) or 0
end

function place(id,x,y)
    return bot:place(bot.x + x,bot.y + y,id)
end

function punch(x,y)
    return bot:hit(bot.x + x,bot.y + y)
end

function tilePunch(x,y)
    for _,num in pairs(tileBreak) do
        if getTile(x + num,y).fg == farming.item_id then
            return true
        end
    end
    return false
end

function tilePlace(x,y)
    for _,num in pairs(tileBreak) do
        if getTile(x + num,y).fg == 0 then
            return true
        end
    end
    return false
end

local GROWSCAN = {
    tile = function(self, id)
        return (bot:getWorld().growscan:getTiles()[id] or 0)
    end,
    object = function(self, id)
        return (bot:getWorld().growscan:getObjects()[id] or 0)
    end,
}

function append_to_file(filename, text)
    local file = io.open(filename, "a") -- Buka file dalam mode append
    if file then
        file:write(text .. "\n") -- Menambahkan teks ke file (dengan tambahan newline)
        file:close() -- Tutup file
        print(text .. ' berhasil di tambahkan (APPEND)')
    else
        print(text .. ' gagal di tambahkan (APPEND)')
    end
end

function checkActiveJammer()
    for _, tile in pairs(getTiles()) do
        if tile.fg == 226 and tile:hasFlag(64) then
            return true
        end
    end
    return false
end

-- Fungsi untuk membaca isi file 
function read_file(filename)
    local file = io.open(filename, "r") -- Buka file dalam mode baca
    if file then
        local content = file:read("*all") -- Baca seluruh isi file
        file:close() -- Tutup file
        return content
    else
        return ""
    end
end

-- Fungsi untuk menulis isi file
function write_file(filename, content)
    local file = io.open(filename, "w") -- Buka file dalam mode tulis
    if file then
        file:write(content) -- Tulis isi ke file
        file:close() -- Tutup file
        return true
    else
        return false
    end
end

function deleteNuke(world)
    -- Nama file yang akan diubah
    local filename = farming.world_list_pnb
    -- Membaca isi file
    local content = read_file(filename)
    if content then
        -- Teks yang ingin dihapus
        local text_to_remove = world.."\n" -- Menambahkan newline (\n) karena kita ingin mencocokkan baris secara penuh
        
        -- Menghapus teks tertentu dari isi file
        local modified_content = string.gsub(content, text_to_remove, "")

        -- Menulis kembali isi file
        if write_file(filename, modified_content) then
            
            print("Teks berhasil dihapus dari file.")
        else
            print("Gagal menulis ke file.")
        end
    else
        print("File tidak ditemukan atau tidak dapat dibaca.")
    end
end

function string.split(inputstr, sep)
    if sep == nil then
        sep = "%s"
    end
    local t = {}
    for str in string.gmatch(inputstr, "([^" .. sep .. "]+)") do
        table.insert(t, str)
    end
    return t
end

function read(fileName)
    local file = io.open(fileName, "r")
    if not file then return "", "" end

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

    file = io.open(fileName, "w")
    if file then
        for _, line in ipairs(lines) do
            file:write(line .. "\n")
        end
        if firstLine then
            file:write(firstLine .. "\n")
        end
        file:close()
    end

    return world, door
end

function readFarm(fileName)
    -- Fetch the JSON data
    local response, err = JSON:content(fileName)
    if not response then
        return false, err
    end

    -- Ensure response is an array and has at least one entry
    if #response == 0 then
        return false, "No data available in JSON"
    end

    -- Move the first element to the end with updated timestamp
    local removed = response[1]
    removed.lastUpdated = os.time()

    table.remove(response, 1)
    table.insert(response, removed)

    -- Write updated data back to the file
    local file, writeErr = io.open(fileName, "w")
    if not file then
        return false, "Could not write to file: " .. (writeErr or "Unknown error")
    end

    file:write(json.encode(response, { indent = false })) -- Minimized indentation for speed
    file:close()

    -- Return the details of the modified entry
    return {
        name = removed.world,
        door = removed.door,
        status = removed.status,
        nuked = removed.nuked,
        toxic = removed.toxic,
        fire = removed.fire,
        tree_total = removed.tree_total,
        fossil_total = removed.fossil_total,
    }
end

function updateFarm(fileName, worldName, updatedData)
    -- Use JSON:content to get the data
    local response, err = JSON:content(fileName)
    if not response then
        return false, err
    end

    -- Find the farm entry with the matching world name and update it
    local farmFound = false
    for _, farm in ipairs(response) do
        if farm.world == worldName then
            -- Update only the necessary fields
            for key, value in pairs(updatedData) do
                farm[key] = value
            end
            farm.lastUpdated = os.time()  -- Update the lastUpdated field
            farmFound = true
            break
        end
    end

    -- If no farm entry is found with the given world name
    if not farmFound then
        return false, "Farm with world name '" .. worldName .. "' not found."
    end

    -- Write back the updated farmMap only if we found and updated the farm
    local file = io.open(fileName, "w+")
    if file then
        local convertData = json.encode(response, { indent = true })  -- 4-space indentation
        file:write(convertData)
        file:close()
    else
        return false, "Could not write to file"
    end

    return true, "Farm data updated successfully"
end

function StatusGoogle()
    local statusNaming = {
        [GoogleStatus.idle] = "Idle",
        [GoogleStatus.processing] = "Processing",
        [GoogleStatus.init_error] = "Init Error",
        [GoogleStatus.invalid_credentials] = "Inv Credentials",
        [GoogleStatus.account_disabled] = "Acc Disabled",
        [GoogleStatus.captcha_required] = "Captcha Required",
        [GoogleStatus.phone_required] = "Phone Required",
        [GoogleStatus.recovery_required] = "Recovery Required",
        [GoogleStatus.no_recovery_challenge] = "No Recovery Challenge",
        [GoogleStatus.couldnt_verify] = "Couldnt Verify",
        [GoogleStatus.unknown_url] = "Unknown URL"
    }
    return statusNaming[bot.google_status] or "UNKNOWN"
end

local GetBot = function(bot)
    local status = getBot(bot).status
    local statusNaming = {
        [BotStatus.offline] = "Offline",
        [BotStatus.online] = "Online",
        [BotStatus.account_banned] = "Account Banned",
        [BotStatus.location_banned] = "Location Banned",
        [BotStatus.server_overload] = "Server Overload",
        [BotStatus.too_many_login] = "Too Many Login",
        [BotStatus.maintenance] = "Maintenance",
        [BotStatus.version_update] = "Version Update",
        [BotStatus.server_busy] = "Server Busy",
        [BotStatus.error_connecting] = "Error Connecting",
        [BotStatus.logon_fail] = "Login Failed",
        [BotStatus.http_block] = "HTTP Blocked",
        [BotStatus.wrong_password] = "Wrong Password",
        [BotStatus.advanced_account_protection] = "Advanced Account Protection",
        [BotStatus.bad_name_length] = "Bad Name Length",
        [BotStatus.invalid_account] = "Invalid Account",
        [BotStatus.guest_limit] = "Guest Limit",
        [BotStatus.changing_subserver] = "Changing Subserver",
        [BotStatus.captcha_requested] = "Captcha",
        [BotStatus.mod_entered] = "Mod Entered",
        [BotStatus.high_load] = "High Load",
        [BotStatus.bad_gateway] = "Bad Gateway" ,
        [BotStatus.server_issue] = "Server Issue" ,
        [BotStatus.retrieving_token] = "Retrieving Token" ,
        [BotStatus.player_entered] = "Player Entered",
        [BotStatus.getting_server_data] = "Getting Server Data",
        [BotStatus.bypassing_server_data] = "Bypassing Server Data",
    }
    return statusNaming[status] or "Loading"
end

function maladyStatus(bot)
    local status = getBot(bot).malady
    local statusNaming = {
        [0] = "None",
        [1] = "Torn Punching Muscle",
        [2] = "Gem Cuts",
        [3] = "Chicken Feet",
        [4] = "Grumbleteeth",
        [5] = "Broken Heart",
        [6] = "Chaos Infection",
        [7] = "Moldy Guts",
        [8] = "Brainworms",
        [9] = "Lupus",
        [10] = "Ecto-Bones",
        [11] = "Fatty Liver",
    }
    return statusNaming[status] or "?"
end

function queryInsert(status)
    -- Set the custom status
    print(string.format(
        '[%d] %s',
        indexBot, status
        )
    )
    bot.custom_status = status
    bot:getConsole():append('`o' .. status)
end

function onVarSearchTutorial(variant, netid)
    if variant:get(0):getString() == "OnRequestWorldSelectMenu" and variant:get(1):getString():find("Your Worlds") then
        local text = variant:get(1):getString()
        local lines = {}
        for line in text:gmatch("[^\r\n]+") do
            table.insert(lines, line)
        end
        for i, value in ipairs(lines) do
            if i == 3 then
                kalimat = lines[3]
                local nilai = kalimat:match("|([a-zA-Z0-9%s]+)|"):gsub("|", ""):gsub("%s", "")
                print(bot.name.." World PNB in "..nilai)
                worldPNB = nilai
            end
        end
    end
end

function onVarCheckQuest(var, netid)
    if var:get(0):getString() == "OnDialogRequest" then
        local text = var:get(1):getString()
        local lines = {}
        for line in text:gmatch("[^\r\n]+") do
            table.insert(lines, line)
        end
        for _,value in ipairs(lines) do
            if value:find("add_button|questselect") then
                canSelectQuest = true
            end
        end
    end
end

function tileDrop(x,y,num)
    local count = 0
    local stack = 0
    for _,obj in pairs(getObjects()) do
        if math.floor((obj.x + 10) / 32) == x and math.floor((obj.y + 10) / 32) == y then
            count = count + obj.count
            stack = stack + 1
        end
    end
    if stack < 20 and count <= (4000 - num) then
        return true
    end
    return false
end

function botInfo(url, status)
    webhook = Webhook.new(url)
    webhook.username = "Notification"
    webhook.content = status
    webhook:send()
end

function formatInt(number)
    local i, j, minus, int, fraction = tostring(number):find('([-]?)(%d+)([.]?%d*)')
    int = int:reverse():gsub("(%d%d%d)", "%1,")
    return minus .. int:reverse():gsub("^,", "") .. fraction
end

function buyClothes()
    local currentClothes = {}
    for _,inventory in pairs(bot:getInventory():getItems()) do
        if getInfo(inventory.id) and getInfo(inventory.id).clothing_type ~= 0 then
            table.insert(currentClothes,inventory.id)
        end
    end
    sleep(100)
    if #currentClothes < 20 then
        queryInsert("[METHOD] Buying Clothes")
        bot:sendPacket(2,"action|buy\nitem|rare_clothes")
        sleep(2500)
        for _,num in pairs(bot:getInventory():getItems()) do
            if getInfo(num.id) and getInfo(num.id).clothing_type ~= 0 then
                if num.id ~= 3934 and num.id ~= 3932 then
                    bot:wear(num.id)
                    sleep(500)
                end
            end
        end
    end
end

function nukeWorldInfo(url, status)
    if string.find(url, ".txt") then
        local file = io.open(url, "a")
        if file then
            file:write(status)
            file:close()
        else
            print("Gagal membuka file: " .. url)
        end
    elseif string.find(url, "discord") then
        local webhook = Webhook.new(url)
        webhook.avatar_url = "https://cdn.discordapp.com/attachments/1058476002050850827/1271789959203917928/ItemSprites_1.png?ex=66b89e32&is=66b74cb2&hm=8976f3d28195c4e278d264965f9db1bc03db1e08d8a94772606b08048e80013f&"
        webhook.username = "WORLD INFO"
        webhook.content = status
        webhook:send()
    end
end

function displayPack(url,id,value)
    local webhook = Webhook.new(url)
    webhook.username = 'Pack Information'
    webhook.avatar_url = "https://cdn.discordapp.com/attachments/1058476002050850827/1271789959203917928/ItemSprites_1.png?ex=66b89e32&is=66b74cb2&hm=8976f3d28195c4e278d264965f9db1bc03db1e08d8a94772606b08048e80013f&"
    webhook.embed1.use = true
    webhook.embed1.title = "PACK INFORMATION"
    webhook.embed1.description = "Last update : <t:"..os.time()..":R>\n" .. value
    webhook.embed1.color = 0x6a5acd --embed color

    webhook:edit(id)
end

function OnVariantList(variant, netid)
    if variant:get(0):getString() == "OnConsoleMessage" then
        if variant:get(1):getString():lower():find("inaccessible") 
            or variant:get(1):getString():lower():find("lower") 
            or variant:get(1):getString():lower():find("banned") 
            or variant:get(1):getString():lower():find("tomorrow")
        then
            warpStatus = variant:get(1):getString()
            nuked = true
            unlistenEvents()
        end
    end
end

function warp(world,id,check,checkCCTV)
    cok = 0
    nuked = false
    addEvent(Event.variantlist, OnVariantList)
    sleep(100)
    if world == "" or world == nil then
        nukeWorldInfo(farming.webhook.world, string.format(
            '[UNKNOWN] %s|%s world string is none',
            world, id
        ))
        nuked = true
        return
    end
    while not bot:isInWorld(world:upper()) and not nuked do
        ::RETRY_WARP::
        if bot.status == BotStatus.online and bot:getPing() == 0 then
            bot:disconnect()
            sleep(1000)
        end
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
        if id ~= "" then
            bot:sendPacket(3,"action|join_request\nname|"..world:upper().."|"..id:upper().."\ninvitedWorld|0")
        else
            bot:sendPacket(3,"action|join_request\nname|"..world:upper().."\ninvitedWorld|0")
        end
        listenEvents(5)
        sleep(farming.interval.warp)
        if cok == 5 and not bot:isInWorld(world:upper()) then
            queryInsert("[WARP] Can't entering " .. world:upper() .. " for unknown reason")
            sleep(100)
            while bot.status == BotStatus.online do
                bot:disconnect()
                bot.auto_reconnect = false
                sleep(1000)
            end
            sleep(30000)
            cok = 0
            bot.auto_reconnect = true
        else
            cok = cok + 1
        end
    end
    if id ~= "" and getTile(bot.x,bot.y).fg == 6 and not nuked then
        cok = 0
        while getTile(bot.x,bot.y).fg == 6 and not nuked do
            while bot.status ~= BotStatus.online or bot:getPing() == 0 do
                sleep(1000)
                if bot.google_status == 3 or bot.google_status == 7 then
                    bot:connect()
                    sleep(1000)
                end
                while bot.status == BotStatus.account_banned do
                    bot.auto_reconnect = false
                    bot:stopScript()
                end
            end
            bot:sendPacket(3,"action|join_request\nname|"..world:upper().."|"..id:upper().."\ninvitedWorld|0")
            sleep(5000)
            cok = cok + 1
            if cok == 5 and check then
                nuked = true
            end
        end
        if getTile(bot.x,bot.y).fg == 6 then
            nukeWorldInfo(farming.webhook.world, string.format(
                '[WARP] %s|%s door is wrong',
                world, id
            ))
            sleep(100)
            nuked = true
        end
    end
    sleep(100)
    removeEvent(Event.variantlist)
    if checkCCTV and bot:isInWorld(world:upper()) then
        local intruder = checkIntruder()
        if intruder.status then
            nukeWorldInfo(farming.webhook.info, string.format(
                'Intruder alert! Detected: %s in %s at %d:%d',
                world, intruder.name, intruder.x, intruder.y 
            ))
            sleep(2500)
        end
    end
end

function reconnect(world,id,x,y)
    local timeNow = os.date("*t")
    if timeNow.hour == 11 then
        FirstGoals = false
        SecondGoals = false
        ThirdGoals = false
    end
    while bot:getPing() >= 200 do
        sleep(100)
    end
    if bot:isResting() then
        while bot:isResting() do
            sleep(1000)
        end
    end
    if bot.status == BotStatus.mod_entered then
        botInfo(farming.webhook.info, ":orange_circle: "..bot.name.." ["..indexBot.."] Mod entered!.")
        for _,botz in pairs(getBots()) do
            botz.auto_reconnect = false
            botz:disconnect()
            sleep(100)
        end
        sleep(60 * 60000)
        for _,botz in pairs(getBots()) do
            botz.auto_reconnect = true
            sleep(100)
        end
    end
    if bot:getWorld().name ~= world and bot.status == BotStatus.online then
        sleep(2000)
        bot:disconnect()
        sleep(1000)
    end
    if bot.status ~= BotStatus.online or bot:getPing() == 0 then
        bot.auto_reconnect = true
        while bot.status ~= BotStatus.online or bot:getPing() == 0 do
            sleep(5000)
            if bot.status == BotStatus.account_banned then
                botInfo(farming.webhook.info, ":orange_circle: "..bot.name.." ["..indexBot.."] is banned.")
                bot.auto_reconnect = false
                bot:stopScript()
            end
            if bot.status == BotStatus.location_banned or bot.google_status == 3 or bot.google_status == 7 then
                bot:connect()
                sleep(1000)
            end
            if bot.google_status == GoogleStatus.captcha_required then
                botInfo(farming.webhook.info, ":orange_circle: "..bot.name.." ["..indexBot.."] is error connecting (" .. botProxy .. "). @everyone")
                while bot.google_status == GoogleStatus.captcha_required do
                    sleep(1000)
                end
            end
            if bot.status == BotStatus.server_issue or bot.status == BotStatus.maintenance then
                for _,botz in pairs(getBots()) do
                    botz.auto_reconnect = false
                    botz:disconnect()
                    sleep(100)
                end
                sleep(15 * 60000)
                for _,botz in pairs(getBots()) do
                    botz.auto_reconnect = true
                    sleep(100)
                end
            end
        end
        sleep(100)
        warp(world,id)
        sleep(100)
        if nuked then
            queryInsert('[RECONNECT] ' .. world .. ' nuked when reconnecting: ' .. warpStatus)
            bot:stopScript()
            sleep(100)
        end
        if x and y and (bot.x ~= x or bot.y ~= y) then
            bot:findPath(x,y)
            sleep(100)
        end
        bot:say("/status")
        sleep(100)
    end
end

function activeWorld(world)
    local seperateData = string.split(world, "|")
    return {name = seperateData[1] or "", door = seperateData[2] or ""}
end

function storeSeed(world)
    bot.auto_collect = false
    queryInsert("[FARMING] Storing Seeds")

    updateConfig()
    sleep(100)

    local selectWorld = farming.storage_seed_list[math.random(1, #farming.storage_seed_list)]
    local storage = activeWorld(selectWorld)

    warp(storage.name, storage.door, true, true)
    sleep(100)
    
    if not nuked and bot:isInWorld(storage.name:upper()) then
        for _,tile in pairs(getTiles()) do
            reconnect(storage.name, storage.door)
            if tile.y > 1 and tile.y < 25 and tile.x > 1 and tile.x < 98 then
                if tileDrop(tile.x,tile.y,100) then
                    bot:findPath(tile.x + 1,tile.y)
                    bot:setDirection(true)
                    sleep(100)
                    if findItem(farming.item_seed) > 100 then
                        bot:drop(farming.item_seed, findItem(farming.item_seed))
                        reconnect(storage.name, storage.door, tile.x + 1, tile.y)
                    end
                    if findItem(farming.item_seed) <= 100 then
                        break
                    end
                end
            end
        end
    else
        if nuked then
            nukeWorldInfo(farming.webhook.world, string.format(
                '[SEED] %s is %s',
                storage.name, warpStatus or "NUKED"
            ))
            sleep(5000)
        end
    end
    sleep(100)
    if farming.random_world then
        clearHistory(5)
    end
    if farming.claim_goals.enable then
        if not FirstGoals or not SecondGoals or not ThirdGoals then
            claimGoals(farming.claim_goals.world, farming.claim_goals.doorId)
            sleep(100)
            takeMagplant()
            sleep(100)
        end
    end
    warp(world,doorFarm)
    sleep(100)
    bot.auto_collect = true
    sleep(100)
    queryInsert("[FARMING] Success Storing Seeds")
    sleep(100)
end

function clear(world,id,x,y)
    for _,item in pairs(bot:getInventory():getItems()) do
        reconnect(world,id,x,y)
        if not includesNumber(farming.whitelist, item.id) and findItem(item.id) >= 100 and bot:isInWorld() then
            bot:trash(item.id, findItem(item.id))
            sleep(500)
            reconnect(world,id,x,y)
        end
    end
end

function goExit()
    while bot:getWorld().name ~= "EXIT" do
        if bot.status == BotStatus.online and bot:getPing() == 0 then
            bot:disconnect()
            sleep(1000)
        end
        while bot.status ~= BotStatus.online do
            sleep(1000)
            if bot.status == BotStatus.account_banned then
                bot:stopScript()
            end
        end
        bot:sendPacket(3,"action|quit_to_exit")
        sleep(7000)
    end
end

function checkTutorial()
    goExit()
    sleep(100)
    worldPNB = ""
    sleep(100)
    addEvent(Event.variantlist, onVarSearchTutorial)
    while worldPNB == "" and bot:getWorld().name == "EXIT" do
        bot:sendPacket(3,"action|world_button\nname|_16")
        listenEvents(5)
        sleep(2000)
    end
    sleep(100)
    removeEvent(Event.variantlist)
    sleep(100)
end

function pnbTutorial()
    warp(worldPNB,"",true,true)
    sleep(100)
    if not nuked and bot:getWorld().name == worldPNB and bot:getWorld():hasAccess(bot.x-1,bot.y) > 0 then
        if GROWSCAN:tile(226) == 0 then
            if findItem(226) == 0 then
                if bot.gem_count > 2000 then
                    while findItem(226) == 0 and bot.gem_count > 2000 do
                        bot:buy("signal_jammer")
                        sleep(200)
                        reconnect(worldPNB,"")
                    end
                end
            end
            while findItem(226) >= 1 and getTile(bot.x, bot.y -2).fg == 0 do
                place(226,0,-2)
                sleep(100)
            end
        end
        while not checkActiveJammer() and getTile(bot.x, bot.y -2).fg == 226 do
            punch(0,-2)
            sleep(500)
        end
        if findItem(farming.item_id) >= farming.tile_number and bot:getWorld().name == worldPNB:upper() and bot:getWorld():hasAccess(bot.x-1,bot.y) > 0 then
            ex = bot.x
            ye = bot.y
            bot.auto_collect = true
            while findItem(farming.item_id) > farming.tile_number and findItem(farming.item_seed) <= 190 and bot:getWorld().name == worldPNB:upper() do
                while tilePlace(ex,ye) and bot:getWorld().name == worldPNB do
                    for _,i in pairs(tileBreak) do
                        if getTile(ex,ye + i).fg == 0 and getTile(ex,ye + i).bg == 0 then
                            place(farming.item_id,0,i)
                            sleep(farming.interval.place)
                            reconnect(worldPNB,"",ex,ye)
                        end
                    end
                end
                while tilePunch(ex,ye) and bot:getWorld().name == worldPNB do
                    for _,i in pairs(tileBreak) do
                        if getTile(ex,ye + i).fg ~= 0 or getTile(ex,ye + i).bg ~= 0 then
                            punch(0,i)
                            sleep(farming.interval.punch)
                            reconnect(worldPNB,"",ex,ye)
                        end
                    end
                end
            end
        end
    elseif bot:isInWorld() and bot:getWorld():hasAccess(bot.x-1,bot.y) == 0 then
        checkTutorial()
    end
end

function pnbOtherWorld()
    ::RETRY_JOIN_PNB::
    worldBreak, doorBreak = read(farming.world_list_pnb)

    if worldBreak == "" then
        bot:stopScript()
        botInfo(farming.webhook.info, ":warning: "..bot.name.." ["..indexBot.."] cant read file inside pnb otherworld!.")
    end

    warp(worldBreak,doorBreak,true,true)
    sleep(100)

    if nuked and string.find(warpStatus, "inaccessible") then
        deleteNuke(worldBreak .. '|' .. doorBreak)
        goto RETRY_JOIN_PNB
    end

    if bot:isInWorld(worldBreak:upper()) then
        if findItem(farming.item_id) >= farming.tile_number and bot:getWorld().name == worldBreak:upper() then
            ex = bot.x
            ye = bot.y
            sleep(100)
            bot:findPath(ex,ye)
            sleep(100)
            bot.auto_collect = true
            sleep(100)
            while findItem(farming.item_id) > farming.tile_number and findItem(farming.item_seed) <= 190 and bot:getWorld().name == worldBreak:upper() and bot:getMaladyDuration() > 30 do
                if bot.x ~= ex and bot.y ~= ye then
                    bot:findPath(ex, ye)
                    sleep(100)
                end
                if not bot:isInWorld(worldBreak:upper()) or getTile(bot.x, bot.y).fg == 6 then
                    bot:warp(worldBreak .. '|' .. doorBreak)
                    sleep(5000)
                end
                while tilePlace(ex,ye - 1) do
                    for _,i in pairs(tileBreak) do
                        if getTile(ex + i,ye - 1).fg == 0 then
                            place(farming.item_id,i,-1)
                            sleep(farming.interval.place)
                            reconnect(worldBreak,doorBreak,ex,ye)
                        end
                    end
                end
                while tilePunch(ex,ye - 1) do
                    for _,i in pairs(tileBreak) do
                        if getTile(ex + i,ye - 1).fg ~= 0 then
                            punch(i,-1)
                            sleep(farming.interval.punch)
                            reconnect(worldBreak,doorBreak,ex,ye)
                        end
                    end
                end
                reconnect(worldBreak,doorBreak,ex,ye)
                sleep(10)
            end
        end
    end
end

function checkItemStorage()
    for _,item in pairs(farming.event.list) do
        if findItem(item.id) >= item.count then
            return true
        end
    end
    return false
end

function autoWear(world)
    if farming.auto_wear.enable then
        if farming.auto_wear.buy.enable then
            while bot:isInWorld() and bot.gem_count >= farming.auto_wear.buy.price and findItem(farming.auto_wear.id) == 0 do
                bot:buy("mooncake_mag")
                sleep(500)
                reconnect(world,doorFarm)
            end
        end
        while bot:isInWorld() and not bot:getInventory():getItem(farming.auto_wear.id).isActive and findItem(farming.auto_wear.id) > 0 do
            bot:wear(farming.auto_wear.id)
            sleep(200)
            reconnect(world,doorFarm)
        end
    end
end

function OnCheckSurgeryError(var,netid)
    if var:get(0):getString() == "OnDialogRequest" then
        local text = var:get(1):getString()
        local lines = {}
        for line in text:gmatch("[^\r\n]+") do
            table.insert(lines, line)
        end
        surgeryDialogPopup = false
        for _,str in ipairs(lines) do
            if str:find("autoSurgeonUi") then
                surgeryDialogPopup = true
                break
            end
        end
        unlistenEvents()
    end
end

function buyLockForSurgery(amount)
    for _ = 1, amount do
        if bot.status == BotStatus.online and bot:isInWorld() and findItem(242) < amount and bot.gem_count >= 2000 then
            bot:buy("world_lock")
            sleep(1200)
        end
    end
end

function queueWorld(destination)
    local numPlayer = 0
    for _,client in pairs(getBots()) do
        if client.name ~= bot.name and client:getWorld().name == destination:upper() then
            numPlayer = numPlayer + 1
        end
    end
    return numPlayer
end

function secondToTime(seconds)
    local hours = math.floor(seconds / 3600)
    local minutes = math.floor((seconds % 3600) / 60)
    local remainingSeconds = seconds % 60

    return string.format("%d hours, %d minutes, %d seconds", hours, minutes, remainingSeconds)
end

function solveMalady(checkStatus,world)
    if farming.malady.enable then
        if checkStatus and bot.status == BotStatus.online and bot:isInWorld() and bot:getMaladyDuration() < 300 then
            bot:say("/status")
            sleep(1000)
        end
        if bot:getMaladyDuration() < 300 then
            while bot:getMaladyDuration() > 0 and bot:getMaladyDuration() < 300 do
                queryInsert('[MALADY] Waiting malady to disappear: ' .. secondToTime(bot:getMaladyDuration()))
                sleep(5000)
            end
        end
        if (bot.malady == 1 or bot.malady == 2) and (bot.gem_count > 6000 or findItem(242) >= 3) then
            if farming.malady and farming.malady.location then
                if findItem(242) == 0 then
                    buyLockForSurgery(3)
                    sleep(100)
                end

                local key = tostring(bot.malady)
                local selectLocation = farming.malady.location[key]

                if selectLocation then
                    local SurgeryWorld = selectLocation.world
                    local SurgeryX = selectLocation.x
                    local SurgeryY = selectLocation.y

                    local storage = activeWorld(SurgeryWorld)

                    warp(storage.name, storage.door, false, false)
                    sleep(100)

                    if not nuked and bot:isInWorld(storage.name:upper()) then
                        if bot:findPath(SurgeryX, SurgeryY) then
                            sleep(1000)
                            addEvent(Event.varlist, OnCheckSurgeryError)
                            sleep(1000)
                            if bot.status == BotStatus.online and bot:isInWorld(storage.name:upper()) then
                                bot:wrench(SurgeryX, SurgeryY)
                                listenEvents(5)
                            end
                            if surgeryDialogPopup and findItem(242) >= 3 then
                                if bot.status == BotStatus.online then
                                    bot:sendPacket(2,"action|dialog_return\ndialog_name|autoSurgeonUi\nbuttonClicked|purchaseCureBtn")
                                    sleep(1000)
                                end
                                if bot.status == BotStatus.online then
                                    bot:sendPacket(2,"action|dialog_return\ndialog_name|autoSurgeonCurePurchaseUi\nbuttonClicked|purchaseCureBtn")
                                    sleep(1000)
                                end
                            end
                        end
                    end
                end
            end
            bot:say("/status")
            sleep(100)
        end
        if bot.malady == 0 then
            if farming.malady.infect then
                warp(world,doorFarm)
                sleep(100)
                if bot:isInWorld() then

                    local spam = bot.auto_spam
                    local messages = spam.messages -- Spam Message List

                    for i, message in pairs(farming.chat_list) do
                        messages:add(message)
                    end

                    local malady = bot.auto_malady
                    malady.enabled = true
                    malady.auto_surgery_station = false
                    malady.auto_vial = false
                    malady.auto_chicken_feet = true
                    malady.auto_grumbleteeth = true
                    malady.auto_refresh = false

                    queryInsert("[METHOD] Getting Malady")

                    while bot.malady == 0 do
                        while bot.status ~= BotStatus.online or bot:getPing() == 0 do
                            sleep(1000)
                            if bot.google_status == 3 or bot.google_status == 7 then
                                bot:connect()
                                sleep(1000)
                            end
                            while bot.status == BotStatus.account_banned do
                                bot.auto_reconnect = false
                                bot:stopScript()
                            end
                        end
                        if bot:isInWorld() and bot.status == BotStatus.online then
                            bot:say("/status")
                            sleep(100)
                        end
                        sleep(math.random(5, 60) * 1000)
                    end

                    queryInsert("[MALADY] Success getting malady: " .. maladyStatus(bot.name))
                    malady.enabled = false
                end
                warp(world,doorFarm)
                sleep(100)
            else
                bot.auto_collect = false
                queryInsert("[MALADY] Taking vile")
            
                local selectWorld = farming.storage_vile_list[math.random(1, #farming.storage_vile_list)]
                local storage = activeWorld(selectWorld)
            
                while queueWorld(storage.name:upper()) > 3 do
                    queryInsert("[MALADY] Queueing in Malady")
                    while bot.status ~= BotStatus.online or bot:getPing() == 0 do
                        sleep(1000)
                        if bot.google_status == 3 or bot.google_status == 7 then
                            bot:connect()
                            sleep(1000)
                        end
                        while bot.status == BotStatus.account_banned do
                            bot.auto_reconnect = false
                            bot:stopScript()
                        end
                    end
                    sleep(math.random(5,15) * 1000)
                end

                warp(storage.name, storage.door, true, true)
                sleep(100)
                
                if not nuked and bot:isInWorld(storage.name:upper()) then
                    while findItem(farming.malady.id) == 0 do
                        for _,obj in pairs(getObjects()) do
                            reconnect(storage.name, storage.door)
                            sleep(100)
                            if obj.id == farming.malady.id and bot:findPath(math.floor((obj.x + 10) / 32) + 1,math.floor((obj.y + 10) / 32)) then
                                sleep(200)
                                bot:collectObject(obj.oid, 3)
                                sleep(200)
                            end
                            if findItem(farming.malady.id) > 0 then
                                break
                            end
                        end
                        reconnect(storage.name, storage.door)
                        sleep(100)
                    end
                    sleep(500)
                    bot:setDirection(true)
                    sleep(500)
                    while findItem(farming.malady.id) > 1 do
                        bot:drop(farming.malady.id, findItem(farming.malady.id) - 1)
                        reconnect(storage.name, storage.door)
                        sleep(500)
                    end
                    while findItem(farming.malady.id) == 1 and bot.malady == 0 do
                        bot:findPath(math.random(3,50), bot.y)
                        sleep(500)
                        bot:use(farming.malady.id)
                        sleep(500)
                        bot:say("/status")
                        sleep(500)
                        reconnect(storage.name, storage.door)
                    end
                    if findItem(farming.malady.id) == 0 or bot.malady ~= 0 then
                        bot:say("used crotttt")
                        sleep(1000)
                    end
                end
                if bot.status == BotStatus.online and bot:isInWorld() then
                    bot:say("/status")
                    sleep(100)
                end
                warp(world,doorFarm)
                sleep(100)
                bot.auto_collect = true
                sleep(100)
            end
        end
    end
end

function pauseFarming()
    if not farming.pause_farming then
        return
    end

    while farming.pause_farming do
        queryInsert('FARMING PAUSED')
        sleep(math.random(30,60) * 1000)
        updateConfig()
    end
end

function pnb(world)
    if bot.level >= 12 then
        updateConfig()
        sleep(100)
        solveMalady(true, world)
        sleep(100)
        queryInsert("[FARMING] Breaking Block's")
        sleep(100)
        if bot:isInWorld() then
            if farming.random_chat then
                local chatBot = farming.chat_list[math.random(1, #farming.chat_list)]
                bot:say(chatBot)
                sleep(1000)
                local chatBot = farming.emote_list[math.random(1, #farming.emote_list)]
                bot:say(chatBot)
                sleep(1000)
            end
        end
        if farming.pnb_other_world then
            pnbOtherWorld()
        else
            if findItem(farming.item_id) >= farming.tile_number and bot:getWorld().name == world:upper() then
                ex = math.random(5, 90)
                ye = 1
                sleep(100)
                bot:findPath(ex,ye)
                sleep(100)
                bot.auto_collect = true
                sleep(100)
                while findItem(farming.item_id) > farming.tile_number and findItem(farming.item_seed) <= 190 and bot:getMaladyDuration() > 30 do
                    if bot.x ~= ex and bot.y ~= ye then
                        bot:findPath(ex, ye)
                        sleep(100)
                    end
                    while tilePlace(ex,ye - 1) and bot:isInTile(ex, ye) do
                        for _,i in pairs(tileBreak) do
                            if getTile(ex + i,ye - 1).fg == 0 then
                                place(farming.item_id,i,-1)
                                sleep(farming.interval.place)
                                reconnect(world,doorFarm,ex,ye)
                            end
                        end
                    end
                    while tilePunch(ex,ye - 1) and bot:isInTile(ex, ye) do
                        for _,i in pairs(tileBreak) do
                            if (getTile(ex + i,ye - 1).fg == farming.item_seed or getTile(ex + i,ye - 1).fg == farming.item_id) then
                                punch(i,-1)
                                sleep(farming.interval.punch)
                                reconnect(world,doorFarm,ex,ye)
                            end
                        end
                    end
                    reconnect(world,doorFarm,ex,ye)
                end
                sleep(100)
            end
        end
        switchBreak = switchBreak + 1
        if switchBreak > 4 then
            switchBreak =  1
        end
        sleep(100)
        solveMalady(true, world)
        sleep(100)
        clear(world,doorFarm,ex,ye)
        sleep(100)
        if farming.event.enable and checkItemStorage() then
            dropStorage(world)
            sleep(100)
        end
        if farming.buy_clothes and bot.gem_count >= (bot:getInventory():price() + 1000) then
            if bot:getInventory().slotcount < 86 and bot.gem_count >= bot:getInventory():price() then
                queryInsert("[FARMING] Upgrading Backpack x" .. bot:getInventory().slotcount)
                bot:buy("upgrade_backpack")
                sleep(1200)
                reconnect(world,doorFarm,ex,ye)
            end
            if bot.gem_count >= 3500 then
                buyClothes()
                sleep(100)
            end
        end
        if bot.gem_count > farming.purchase.minimum_gem or isItemInInventory(farming.purchase.list, 5) then
            buyPack(world)
            sleep(100)
        end
        warp(world,doorFarm)
        sleep(100)
        plant(world)
        sleep(100)
    end
end

function isItemInInventory(tableName, quantity)
    local amount = quantity or 1
    for _,name in pairs(tableName) do
        if findItem(name) >= amount then
            return true
        end
    end
    return false
end

function includesNumber(table, number)
    for _,num in pairs(table) do
        if num == number then
            return true
        end
    end
    return false
end

function dropStorage(world)
    bot.auto_collect = false
    queryInsert("[FARMING] Dropping Item Event")

    local storage = activeWorld(farming.event.world)
    warp(storage.name,storage.door,true,true)

    if not nuked and bot:isInWorld(storage.name:upper()) then
        for _,item in pairs(farming.event.list) do
            for _,tile in pairs(getTiles()) do
                reconnect(storage.name,storage.door)
                if (tile.x >= 1 and tile.x <= 98) and (tile.y >= 1 and tile.y <= 25) and tileDrop(tile.x, tile.y, findItem(item.id)) and findItem(item.id) >= 1 then
                    if bot:findPath(tile.x + 1, tile.y) then
                        sleep(100)
                        local countDrop = 0
                        while findItem(item.id) > 0 and tileDrop(tile.x,tile.y, findItem(item.id)) do
                            bot:setDirection(true)
                            sleep(100)
                            bot:drop(item.id, findItem(item.id))
                            sleep(500)
                            reconnect(storage.name,storage.door,tile.x + 1, tile.y)
                            if countDrop >= 5 then
                                break
                            else
                                countDrop = countDrop + 1
                            end
                        end
                    end
                end
                if findItem(item.id) == 0 then
                    break
                end
            end
            reconnect(storage.name,storage.door)
            sleep(100)
        end
    else
        if nuked then
            nukeWorldInfo(farming.webhook.world, string.format(
                '[ITEM] %s is %s',
                storage.name, warpStatus or "NUKED"
            ))
        end
    end
    warp(world,doorFarm)
    sleep(100)
    bot.auto_collect = true
    queryInsert("[FARMING] Success Dropping Item")
end

function buyPack(world)
    bot.auto_collect = false
    sleep(100)
    queryInsert("[FARMING] Buying Pack")
    sleep(100)
    updateConfig()
    sleep(100)
    if farming.edit_note_profile and bot:isInWorld() then
        local netid = getLocal().netid
        bot:sendPacket(2,"action|wrench\n|netid|"..netid)
        sleep(1000)
        bot:sendPacket(2,"action|dialog_return\ndialog_name|popup\nnetID|"..netid.."|\nbuttonClicked|notebook_edit")
        sleep(1000)
        bot:sendPacket(2,"action|dialog_return\ndialog_name|paginated_personal_notebook_view\npageNum|0|\nbuttonClicked|editPnPage")
        sleep(1000)
        bot:sendPacket(2,"action|dialog_return\ndialog_name|paginated_personal_notebook_edit\npageNum|0|\nbuttonClicked|save\n\npersonal_note|Total Profit Pack : "..bot.gem_count)
        sleep(1000)
    end

    ::ENTER_PACK::

    local indexWorld = math.random(1, #farming.storage_pack_list)
    local selectWorld = farming.storage_pack_list[indexWorld]
    local storage = activeWorld(selectWorld)

    warp(storage.name,storage.door,true,true)

    if nuked and string.find(warpStatus, "inaccessible") then
        nukeWorldInfo(farming.webhook.world, string.format(
            '[PACK] %s is %s',
            storage.name, warpStatus or "NUKED"
        ))
        sleep(100)
        table.remove(farming.storage_pack_list, indexWorld)
        sleep(100)
        goto ENTER_PACK
    end
    if nuked and string.find(warpStatus, "high") then
        sleep(100)
        goto ENTER_PACK
    end

    if not nuked and bot:isInWorld(storage.name:upper()) then
        while bot.gem_count > farming.purchase.price do
            if bot.gem_count > farming.purchase.price and bot:isInWorld() then
                if bot.status == BotStatus.online then
                    bot:buy(farming.purchase.name)
                    sleep(1000)
                    if findItem(farming.purchase.list[1]) == 0 and bot:isInWorld() then
                        bot:buy("upgrade_backpack")
                        sleep(200)
                    end
                end
            else
                break
            end
            if findItem(242) > 100 and bot:isInWorld() then
                bot:wear(242)
                sleep(100)
            end
            if isItemInInventory(farming.purchase.list, 150) then
                break
            end
            reconnect(storage.name, storage.door)
        end
        if farming.purchase.name == "world_lock_10_pack" and bot.gem_count >= 2000 then
            while bot.gem_count >= 2000 do
                if bot.gem_count >= 2000 and findItem(farming.purchase.list[1]) < 200 and bot:isInWorld() then
                    if bot.status == BotStatus.online then
                        bot:buy("world_lock")
                        sleep(1000)
                        if findItem(farming.purchase.list[1]) == 0 and bot:isInWorld() then
                            bot:buy("upgrade_backpack")
                            sleep(200)
                        end
                    end
                else
                    break
                end
                if findItem(242) >= 100 and bot:isInWorld() then
                    bot:wear(242)
                    sleep(100)
                end
                if findItem(farming.purchase.list[1]) == 200 then
                    break
                end
                reconnect(storage.name, storage.door)
            end
        end
        for _,pack in pairs(farming.purchase.list) do
            for _,tile in pairs(bot:getWorld():getTiles()) do
                reconnect(storage.name, storage.door)
                if (tile.x >= 1 and tile.x <= 98) and (tile.y >= 1 and tile.y <= 25) then
                    if tileDrop(tile.x,tile.y,findItem(pack)) and bot:findPath(tile.x + 1,tile.y) then
                        sleep(100)
                        bot:setDirection(true)
                        sleep(100)
                        reconnect(storage.name, storage.door, tile.x + 1, tile.y)
                        if findItem(pack) > 0 and tileDrop(tile.x,tile.y,findItem(pack)) then
                            bot:drop(pack, findItem(pack))
                            sleep(500)
                            reconnect(storage.name, storage.door, tile.x + 1, tile.y)
                        end
                    end
                end
                if findItem(pack) == 0 then
                    break
                end
            end
        end
    end
    sleep(100)
    if farming.random_world then
        clearHistory(4)
    end
    warp(world,doorFarm)
    sleep(100)
    bot.auto_collect = true
    queryInsert("[FARMING] Success Buying Packs")
end

function isPlantable(tile)
    local tempTile = getTile(tile.x, tile.y + 1)
    if not tempTile.fg then 
        return false 
    end
    local collision = getInfo(tempTile.fg).collision_type
    return tempTile and ( collision == 1 or collision == 2 )
end

function plant(world)
    queryInsert("[FARMING] Planting Seeds")
    sleep(100)
    for _,tile in pairs(tilePath) do
        reconnect(world,doorFarm)
        if getTile(tile.x,tile.y).fg == 0 and isPlantable(getTile(tile.x,tile.y)) and bot:getWorld():hasAccess(tile.x,tile.y) > 0 and findItem(farming.item_seed) > 0 and bot:getWorld().name == world:upper() then
            if bot:findPath(tile.x,tile.y) then
                for _, i in pairs(mode3Tile) do
                    while getTile(tile.x + i,tile.y).fg == 0 and isPlantable(getTile(tile.x + i,tile.y)) and bot:getWorld():hasAccess(tile.x + i,tile.y) > 0 and findItem(farming.item_seed) > 0 and bot.x == tile.x and bot.y == tile.y and bot:getWorld().name == world:upper() do
                        place(farming.item_seed,i,0)
                        sleep(math.random(farming.interval.plant - 30,farming.interval.plant + 30))
                        reconnect(world,doorFarm,tile.x,tile.y)
                    end
                end
            end
        end
    end
end

function takePickaxe()
    bot.auto_collect = false
    sleep(100)
    queryInsert("[FARMING] Taking Pickaxe")
    sleep(100)
    updateConfig()
    sleep(100)

    local storage = activeWorld(farming.storage_item_list[storageIndex])
    sleep(100)

    while queueWorld(storage.name) >= 3 do
        queryInsert("[FARMING] Queueing in Pickaxe")
        while bot.status ~= BotStatus.online or bot:getPing() == 0 do
            sleep(1000)
            if bot.google_status == 3 or bot.google_status == 7 then
                bot:connect()
                sleep(1000)
            end
            while bot.status == BotStatus.account_banned do
                bot.auto_reconnect = false
                bot:stopScript()
            end
        end
        sleep(math.random(5,15) * 1000)
    end

    warp(storage.name, storage.door, true, true)
    sleep(100)

    if not nuked then
        while findItem(farming.item_hand) == 0 do
            for _,obj in pairs(getObjects()) do
                reconnect(storage.name, storage.door)
                if obj.id == farming.item_hand then
                    bot:findPath(math.floor((obj.x + 10) / 32) + 1,math.floor((obj.y + 10) / 32))
                    sleep(100)
                    bot:collectObject(obj.oid, 3)
                    sleep(100)
                end
                if findItem(farming.item_hand) > 0 then
                    break
                end
            end
            reconnect(storage.name, storage.door)
            sleep(100)
        end
        sleep(100)
        bot:setDirection(true)
        sleep(100)
        while findItem(farming.item_hand) > 1 do
            bot:drop(farming.item_hand, findItem(farming.item_hand) - 1)
            sleep(500)
        end
        bot:wear(farming.item_hand)
        sleep(100)
        goExit()
        sleep(100)
    else
        if nuked then
            nukeWorldInfo(farming.webhook.world, string.format(
                '[PICKAXE] %s is %s',
                storage.name, warpStatus or "NUKED"
            ))
        end
    end
    if findItem(farming.item_hand) >= 1 then
        queryInsert("[FARMING] Success Taking Pickaxe")
        sleep(100)
    else
        queryInsert("[FARMING] Failed Taking Pickaxe")
        sleep(100)
    end
end

function checkItemClothes()
    for _,item in ipairs(itemToWear) do
        if findItem(item) == 0 then 
            return true 
        end
    end
    return false
end

function takeClothes()
    bot.auto_collect = false
    sleep(100)
    queryInsert("[FARMING] Taking Clothes")
    sleep(100)
    updateConfig()
    sleep(100)

    local indexWorld = math.random(1, #farming.storage_item_list)
    local selectWorld = farming.storage_item_list[indexWorld]
    local storage = activeWorld(selectWorld)

    while queueWorld(storage.name) >= 3 do
        queryInsert("[FARMING] Queueing in Taking Clothes")
        while bot.status ~= BotStatus.online or bot:getPing() == 0 do
            sleep(1000)
            if bot.google_status == 3 or bot.google_status == 7 then
                bot:connect()
                sleep(1000)
            end
            while bot.status == BotStatus.account_banned do
                bot.auto_reconnect = false
                bot:stopScript()
            end
        end
        sleep(math.random(5,15) * 1000)
    end

    warp(storage.name, storage.door, true, true)
    sleep(100)

    if not nuked then
        for _,item in pairs(itemToWear) do
            while findItem(item) == 0 do
                for _,obj in pairs(getObjects()) do
                    reconnect(storage.name, storage.door)
                    if obj.id == item then
                        bot:findPath(math.floor((obj.x + 10) / 32) + 1,math.floor((obj.y + 10) / 32))
                        sleep(100)
                        bot:collectObject(obj.oid, 3)
                        sleep(100)
                    end
                    if findItem(item) > 0 then
                        break
                    end
                end
                reconnect(storage.name, storage.door)
                sleep(100)
            end
            if findItem(item) > 0 then
                sleep(500)
                bot:setDirection(true)
                sleep(500)
                while findItem(item) > 1 do
                    bot:drop(item, findItem(item) - 1)
                    sleep(500)
                end
                bot:wear(item)
                sleep(1000)
            end
        end
        goExit()
        sleep(100)
    else
        if nuked then
            nukeWorldInfo(farming.webhook.world, string.format(
                '[ITEM] %s is %s',
                storage.name, warpStatus or "NUKED"
            ))
        end
    end
end

function takeSeed(world)
    ::RETRY_TAKE::

    updateConfig()
    sleep(100)
    queryInsert("[FARMING] Taking Seeds")
    sleep(100)
    local storage = activeWorld(farming.storage_seed_list[storageIndex])
    sleep(100)
    warp(storage.name,storage.door,true,true)
    sleep(100)

    if not nuked then
        for _,obj in pairs(bot:getWorld():getObjects()) do
            reconnect(storage.name, storage.door)
            if obj.id == farming.item_seed then
                if bot:findPath(math.floor((obj.x + 10) / 32),math.floor((obj.y + 10) / 32)) then
                    sleep(100)
                    bot:collectObject(obj.oid, 3)
                    sleep(100)
                end
            end
            if findItem(farming.item_seed) > 0 then
                break
            end
        end
        sleep(100)
    else
        if nuked then
            nukeWorldInfo(farming.webhook.world, string.format(
                '[SEED] %s is %s',
                storage.name, warpStatus or "NUKED"
            ))
        end
    end
    if findItem(farming.item_seed) == 0 then
        storageIndex = (storageIndex % #farming.storage_seed_list) + 1
        goto RETRY_TAKE
    end
    warp(world,doorFarm)
    sleep(100)
    queryInsert("[FARMING] Success Taking Seeds")
    sleep(100)
end

function harvest(world)
    solveMalady(true,world)
    sleep(100)
    autoWear(world)
    sleep(100)
    treeHarvested = 0
    sleep(100)
    if bot.level < farming.fresh_bot_level and farming.fresh_bot then
        queryInsert("[FARMING] Reaching Level")
        sleep(100)
        for _,tile in pairs(tilePath) do
            reconnect(world,doorFarm)
            if getTile(tile.x,tile.y):canHarvest() and bot:isInWorld(world:upper()) and bot:getWorld():hasAccess(tile.x,tile.y) > 0 and bot.level < farming.fresh_bot_level and getBot().status == BotStatus.online and bot:getMaladyDuration() > 30 then
                if bot:findPath(tile.x,tile.y) then
                    for _, i in pairs(mode3Tile) do
                        if getTile(tile.x + i,tile.y).fg == farming.item_seed and getTile(tile.x + i,tile.y):canHarvest() and bot:getWorld():hasAccess(tile.x + i,tile.y) > 0 then
                            treeHarvested = treeHarvested + 1
                            while getTile(tile.x + i,tile.y).fg == farming.item_seed and getTile(tile.x + i,tile.y):canHarvest() and bot:getWorld():hasAccess(tile.x + i,tile.y) > 0 and bot.x == tile.x and bot.y == tile.y do
                                punch(i,0)
                                sleep(math.random(farming.interval.harvest - 30,farming.interval.harvest + 30))
                                reconnect(world,doorFarm,tile.x,tile.y)
                            end
                        end
                    end
                    bot:collect(3)
                end
            end
            if bot.level >= farming.fresh_bot_level then
                break
            end
        end
        if bot.level >= farming.fresh_bot_level then
            queryInsert("[FARMING] Cleaning Objects")
            sleep(100)
            for _,obj in pairs(getObjects()) do
                reconnect(world,doorFarm)
                if obj.id == farming.item_id and getInfo(getTile(math.floor((obj.x + 10) / 32), math.floor((obj.y + 10) / 32)).fg).collision_type == 0 then
                    if bot:findPath(math.floor((obj.x + 10) / 32), math.floor((obj.y + 10) / 32)) then
                        sleep(200)
                        bot:collect(3)
                        sleep(200)
                        reconnect(world,doorFarm,math.floor((obj.x + 10) / 32), math.floor((obj.y + 10) / 32))
                    end
                end
                if findItem(farming.item_id) >= 190 then
                    pnb(world)
                    sleep(100)
                    if findItem(farming.item_seed) > 150 then
                        storeSeed(world)
                        sleep(100)
                    end
                    queryInsert("[FARMING] Cleaning Objects")
                    sleep(100)
                end
            end
        end
    end
    if bot.level >= farming.fresh_bot_level or not farming.fresh_bot then
        queryInsert("[FARMING] Harvesting Tree")
        for _,tile in pairs(tilePath) do
            reconnect(world,doorFarm)
            if getTile(tile.x,tile.y).fg == farming.item_seed and bot:isInWorld(world:upper()) and bot:getWorld():hasAccess(tile.x,tile.y) > 0 and (bot.level >= farming.fresh_bot_level or not farming.fresh_bot) and bot.status == BotStatus.online and bot:getMaladyDuration() > 30 then
                if getTile(tile.x,tile.y):canHarvest() and bot:findPath(tile.x,tile.y) then
                    for _, i in pairs(mode3Tile) do
                        if getTile(tile.x + i,tile.y).fg == farming.item_seed and getTile(tile.x + i,tile.y):canHarvest() and bot:getWorld():hasAccess(tile.x + i,tile.y) > 0 then
                            treeHarvested = treeHarvested + 1
                            while getTile(tile.x + i,tile.y).fg == farming.item_seed and getTile(tile.x + i,tile.y):canHarvest() and bot:getWorld():hasAccess(tile.x + i,tile.y) > 0 and bot.x == tile.x and bot.y == tile.y do
                                punch(i,0)
                                sleep(farming.interval.harvest)
                                reconnect(world,doorFarm,tile.x,tile.y)
                            end
                        end
                    end
                    for _, i in pairs(mode3Tile) do
                        while getTile(tile.x + i,tile.y).fg == 0 and isPlantable(getTile(tile.x + i,tile.y)) and findItem(farming.item_seed) > 0 and bot:getWorld():hasAccess(tile.x + i,tile.y) > 0 and bot.x == tile.x and bot.y == tile.y and bot:getWorld().name == world:upper() do
                            place(farming.item_seed,i,0)
                            sleep(farming.interval.plant)
                            reconnect(world,doorFarm,tile.x,tile.y)
                        end
                    end
                    bot:collect(3)
                end
            end
            if findItem(farming.item_id) >= 190 then
                pnb(world)
                sleep(100)
                if findItem(farming.item_seed) > 150 then
                    storeSeed(world)
                    sleep(100)
                end
                queryInsert("[FARMING] Harvesting Tree")
                sleep(100)
            end
            if treeHarvested > patokanTree then
                queryInsert("[FARMING] Harvested Half Tree! Skipping")
                break
            end
        end
        if farming.detect_object then
            for _,obj in pairs(getObjects()) do
                reconnect(world,doorFarm)
                if obj.id == farming.item_id and getInfo(getTile(math.floor((obj.x + 10) / 32), math.floor((obj.y + 10) / 32)).fg).collision_type == 0 then
                    if bot:findPath(math.floor((obj.x + 10) / 32),math.floor((obj.y + 10) / 32)) then
                        sleep(200)
                        bot:collect(3)
                        sleep(200)
                        reconnect(world,doorFarm,math.floor((obj.x + 10) / 32), math.floor((obj.y + 10) / 32))
                    end
                end
                if findItem(farming.item_id) >= 190 then
                    pnb(world)
                    sleep(100)
                    if findItem(farming.item_seed) > 150 then
                        storeSeed(world)
                        sleep(100)
                    end
                    queryInsert("[FARMING] Cleaning Objects")
                    sleep(100)
                end
            end
        end
    end
    if farming.auto_fill then
        queryInsert("[FARMING] Filling Seeds")
        sleep(100)
        for _,tile in pairs(tilePath) do
            if findItem(farming.item_seed) == 0 then
                takeSeed(world)
                sleep(100)
            end
            if (tile.fg == 0 and tile.y ~= 0 and isPlantable(tile)) and bot:isInWorld(world:upper()) and bot:getWorld():hasAccess(tile.x,tile.y) > 0 and findItem(farming.item_seed) > 0 then
                bot:findPath(tile.x,tile.y)
                for _, i in pairs(mode3Tile) do
                    while getTile(tile.x + i,tile.y).fg == 0 and isPlantable(getTile(tile.x + i,tile.y)) and bot:getWorld():hasAccess(tile.x + i,tile.y) > 0 and findItem(farming.item_seed) > 0 and bot.x == tile.x and bot.y == tile.y and bot:getWorld().name == world:upper() do
                        place(farming.item_seed,i,0)
                        sleep(math.random(farming.interval.plant - 30,farming.interval.plant + 30))
                        reconnect(world,doorFarm,tile.x,tile.y)
                    end
                end
            end
        end
    end
end

function clearBlocks(world)
    queryInsert("[FARMING] Cleaning Blocks")
    sleep(100)
    for _,tile in pairs(getTiles()) do
        reconnect(world,doorFarm)
        if getTile(tile.x,tile.y).fg == farming.item_id and bot.level >= 12 then
            bot:findPath(tile.x,tile.y)
            while getTile(tile.x,tile.y).fg == farming.item_id and bot.x == tile.x and bot.y == tile.y do
                punch(0,0)
                sleep(math.random(farming.interval.punch - 30,farming.interval.punch + 30))
                reconnect(world,doorFarm,tile.x,tile.y)
            end
        end
    end
end

function checkIntruder()
    local blacklist = {
        10258,  -- Pigeon
        1436,   -- Security Camera
        8246,   -- Starship Camera
    }
    for _,list in pairs(blacklist) do
        for _,tile in ipairs(getTiles()) do
            if tile.fg == list then
                return {
                    status = true, 
                    x = tile.x, 
                    y = tile.y, 
                    name = getInfo(tile.fg).name
                }
            end
        end
    end
    return {
        status = false, 
        x = 0, 
        y = 0, 
        name = "NONE"
    }
end

-- Generates a random string of uppercase letters
function randomLetter(length)
    local letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    local str = {}

    for i = 1, length do
        local index = math.random(1, #letters)
        str[i] = letters:sub(index, index)
    end

    return table.concat(str)
end

-- Joins random worlds and performs actions
function clearHistory(amount)
    queryInsert("[FARMING] Clearing History")
    local worldsToJoin = {}

    if farming.random_world then
        for _ = 1, amount do
            table.insert(worldsToJoin, randomLetter(5))
        end
    end

    for _, world in pairs(worldsToJoin) do
        warp(world,"",false,false)
        sleep(100)
        if not nuked and bot:isInWorld(world:upper()) then
            sleep(1000)
            bot:moveRight()
            sleep(1000)
            bot:say("/news")
            sleep(1000)
        end
    end
end

function checkGoalCriteria(line)
    local searchTerms = {"Experience Goal:`", "Seed Goal:", "Gem Goal:`"}
    local validWords = {"Harvest", "Smash", "Plant", "Earn"}

    for _, searchTerm in ipairs(searchTerms) do
        local startIndex, endIndex = line:find(searchTerm)
        if startIndex then
            afterGoal = line:sub(endIndex + 1):match("^%s*([%a%d]+)")
            if afterGoal then
                for _, word in ipairs(validWords) do
                    if afterGoal == word then
                        return false
                    end
                end
            end
            return true
        end
    end
    return true
end

function onVarSearchGoals(var, netid)
    if var:get(0):getString() == "OnDialogRequest" then
        local text = var:get(1):getString()
        local lines = {}
        for line in text:gmatch("[^\r\n]+") do
            table.insert(lines, line)
        end
        finish0 = false
        finish1 = false
        finish2 = false
        skip0 = false
        skip1 = false
        skip2 = false
        totalAwesomeness = ""
        local count = 0
        for _,value in ipairs(lines) do
            if value:find("Goal:") then
                if count == 0 then
                    skip0 = checkGoalCriteria(value)
                elseif count == 1 then
                    skip1 = checkGoalCriteria(value)
                elseif count == 2 then
                    skip2 = checkGoalCriteria(value)
                end
                count = count + 1
            end
            if value:find("add_smalltext|`9Awesomeness:") then
                local str = string.match(value, "%d+%%")
                totalAwesomeness = str or "0"
            end
            if value:find("add_button_with_icon|finish0") then
                finish0 = true
            end
            if value:find("add_button_with_icon|finish1") then
                finish1 = true
            end
            if value:find("add_button_with_icon|finish2") then
                finish2 = true
            end
            if value:find("add_button_with_icon|giveup0") then
                giveup0 = true
            end
            if value:find("add_button_with_icon|giveup1") then
                giveup1 = true
            end
            if value:find("add_button_with_icon|giveup2") then
                giveup2 = true
            end
        end
    end
end

function claimGoals(world,door)
    queryInsert("[METHOD] Claiming Goals")
    sleep(100)

    while queueWorld(world:upper()) >= 3 do
        queryInsert("[METHOD] Queueing in Goals")
        while bot.status ~= BotStatus.online or bot:getPing() == 0 do
            sleep(1000)
            if bot.google_status == 3 or bot.google_status == 7 then
                bot:connect()
                sleep(1000)
            end
            while bot.status == BotStatus.account_banned do
                bot.auto_reconnect = false
                bot:stopScript()
            end
        end
        sleep(math.random(5,15) * 1000)
    end

    warp(world, door,true,false)
    if not nuked and bot:isInWorld(world:upper()) then
        for _,tile in pairs(getTiles()) do
            if tile.fg == 3898 and bot:findPath(tile.x,tile.y + 2) then
                sleep(500)
                bot:wrench(tile.x,tile.y)
                sleep(1000)
                bot:sendPacket(2,"action|dialog_return\ndialog_name|phonecall\ntilex|"..tile.x.."|\ntiley|"..tile.y.."|\nnum|-2|\ndial|12345")
                sleep(1000)
                addEvent(Event.variantlist, onVarSearchGoals)
                bot:sendPacket(2,"action|dialog_return\ndialog_name|phonecall\ntilex|"..tile.x.."|\ntiley|"..tile.y.."|\nnum|12345|\nbuttonClicked|chc1")
                listenEvents(5)
                sleep(1000)
                if finish0 and bot:isInWorld(world:upper()) then
                    bot:sendPacket(2,"action|dialog_return\ndialog_name|phonecall\ntilex|"..tile.x.."|\ntiley|"..tile.y.."|\nnum|-4|\nbuttonClicked|finish0")
                    sleep(1000)
                    bot:sendPacket(2,"action|dialog_return\ndialog_name|phonecall\ntilex|"..tile.x.."|\ntiley|"..tile.y.."|\nnum|-12|\nbuttonClicked|back")
                    sleep(1000)
                    FirstGoals = true
                end
                if skip0 and giveup0 and bot:isInWorld(world:upper()) then
                    bot:sendPacket(2,"action|dialog_return\ndialog_name|phonecall\ntilex|"..tile.x.."|\ntiley|"..tile.y.."|\nnum|-4|\nbuttonClicked|giveup0")
                    sleep(1000)
                    bot:sendPacket(2,"action|dialog_return\ndialog_name|phonecall\ntilex|"..tile.x.."|\ntiley|"..tile.y.."|\nnum|-10|\ngoal|0||\nbuttonClicked|giveuptrue")
                    sleep(1000)
                    FirstGoals = true
                end
                if not finish0 and not giveup0 then
                    FirstGoals = true
                end
                if finish1 and bot:isInWorld(world:upper()) then
                    bot:sendPacket(2,"action|dialog_return\ndialog_name|phonecall\ntilex|"..tile.x.."|\ntiley|"..tile.y.."|\nnum|-4|\nbuttonClicked|finish1")
                    sleep(1000)
                    bot:sendPacket(2,"action|dialog_return\ndialog_name|phonecall\ntilex|"..tile.x.."|\ntiley|"..tile.y.."|\nnum|-12|\nbuttonClicked|back")
                    sleep(1000)
                    SecondGoals = true
                end
                if skip1 and giveup1 and bot:isInWorld(world:upper()) then
                    bot:sendPacket(2,"action|dialog_return\ndialog_name|phonecall\ntilex|"..tile.x.."|\ntiley|"..tile.y.."|\nnum|-4|\nbuttonClicked|giveup1")
                    sleep(1000)
                    bot:sendPacket(2,"action|dialog_return\ndialog_name|phonecall\ntilex|"..tile.x.."|\ntiley|"..tile.y.."|\nnum|-10|\ngoal|1||\nbuttonClicked|giveuptrue")
                    sleep(1000)
                    SecondGoals = true
                end
                if not finish1 and not giveup1 then
                    SecondGoals = true
                end

                if finish2 and bot:isInWorld(world:upper()) then
                    bot:sendPacket(2,"action|dialog_return\ndialog_name|phonecall\ntilex|"..tile.x.."|\ntiley|"..tile.y.."|\nnum|-4|\nbuttonClicked|finish2")
                    sleep(1000)
                    bot:sendPacket(2,"action|dialog_return\ndialog_name|phonecall\ntilex|"..tile.x.."|\ntiley|"..tile.y.."|\nnum|-12|\nbuttonClicked|back")
                    sleep(1000)
                    SecondGoals = true
                end
                if skip2 and giveup2 and bot:isInWorld(world:upper()) then
                    bot:sendPacket(2,"action|dialog_return\ndialog_name|phonecall\ntilex|"..tile.x.."|\ntiley|"..tile.y.."|\nnum|-4|\nbuttonClicked|giveup2")
                    sleep(1000)
                    bot:sendPacket(2,"action|dialog_return\ndialog_name|phonecall\ntilex|"..tile.x.."|\ntiley|"..tile.y.."|\nnum|-10|\ngoal|2||\nbuttonClicked|giveuptrue")
                    sleep(1000)
                    ThirdGoals = true
                end
                if not finish2 and not giveup2 then
                    ThirdGoals = true
                end
                removeEvent(Event.variantlist)
                break
            end
        end
        queryInsert("[METHOD] Success Claiming Goals: " .. (totalAwesomeness or 0) .. "% awesomeness")
    end
    sleep(100)
end

function OnCheckMagplant(var)
    if var:get(0):getString() == "OnDialogRequest" then
        local text = var:get(1):getString()
        local lines = {}
        canTakeRemote = false
        for line in text:gmatch("[^\r\n]+") do
            table.insert(lines, line)
        end
        for _,value in pairs(lines) do
            if value:find("add_button|getplantationdevice|Get Remote|noflags|0|0|") then
                canTakeRemote = true
            end
        end
    end
end

function takeMagplant()
    updateConfig()
    sleep(100)
    while queueWorld(farming.magplant.world) >= 3 do
        queryInsert("[METHOD] Queueing in Magplant")
        while bot.status ~= BotStatus.online or bot:getPing() == 0 do
            sleep(1000)
            if bot.google_status == 3 or bot.google_status == 7 then
                bot:connect()
                sleep(1000)
            end
            while bot.status == BotStatus.account_banned do
                bot.auto_reconnect = false
                bot:stopScript()
            end
        end
        sleep(math.random(5,15) * 1000)
    end

    warp(farming.magplant.world, farming.magplant.doorId, true, false)
    sleep(100)

    if not nuked then
        for _,tile in pairs(getTiles()) do
            if tile.fg == 5638 and bot:findPath(tile.x,tile.y - 1) then
                addEvent(Event.varlist, OnCheckMagplant)
                sleep(1000)
                bot:wrench(tile.x,tile.y)
                listenEvents(5)
                if canTakeRemote and bot:isInWorld() then
                    bot:sendPacket(2,"action|dialog_return\ndialog_name|itemsucker\ntilex|"..tile.x.."|\ntiley|"..tile.y.."|\nbuttonClicked|getplantationdevice")
                    sleep(2000)
                end
            end
            if findItem(5640) == 1 then
                removeEvent(Event.varlist)
                break
            end
        end
    end
    sleep(100)
end

function ScanWorld()
    local hasFire = false
    local hasToxic = false
    local treeTotal = 0
    local fossilTotal = 0
    local itemFloatTotal = 0
    local seedFloatTotal = 0

    -- Loop through tiles, using ipairs for potential performance boost with indexed arrays
    for _, tile in ipairs(getTiles()) do
        -- Check for fire presence (flag 4096)
        if tile:hasFlag(4096) then
            hasFire = true
        end

        -- Check for toxic presence (fg == 778)
        if tile.fg == 778 then
            hasToxic = true
        end

        -- Count total trees (item_seed)
        if tile.fg == farming.item_seed then
            treeTotal = treeTotal + 1
        end

        -- Count total fossils (fg == 3918)
        if tile.fg == 3918 then
            fossilTotal = fossilTotal + 1
        end
    end

    for _,object in ipairs(getObjects()) do
        -- Count total floating items objects
        if object.id == farming.item_id then
            itemFloatTotal = itemFloatTotal + object.count
        end

        -- Count total floating seeds objects
        if object.id == farming.item_id then
            seedFloatTotal = seedFloatTotal + object.count
        end
    end

    -- Return the results
    return {
        fire = hasFire,
        toxic = hasToxic,
        tree_total = treeTotal,
        fossil_total = fossilTotal,
        item_float_total = itemFloatTotal,
        seed_float_total = seedFloatTotal,
    }
end

function OnVarSearchQuest(var, netid)
    if var:get(0):getString() == "OnDialogRequest" then
        local text = var:get(1):getString()
        local lines = {}
        for line in text:gmatch("[^\r\n]+") do
            table.insert(lines, line)
        end
        botCanStartQuest = false
        botFinishQuest = false
        for _,value in ipairs(lines) do
            if value:find("add_button|questselect") then
                botCanStartQuest = true
            elseif value:find("add_button|completequest") then
                botFinishQuest = true
            end
        end
    end
end

function startRoleQuest()
    addEvent(Event.variantlist, OnVarSearchQuest)

    if bot:isInWorld() then
        bot:say("/roles")
        listenEvents(5)

        if botCanStartQuest then
            bot:sendPacket(2, "action|dialog_return\ndialog_name|rolequestspage\nbuttonClicked|questselect")
            sleep(500)
            bot:sendPacket(2, "action|dialog_return\ndialog_name|rolequestselectpage\nbuttonClicked|startFarmerquest")
            sleep(500)
            bot:sendPacket(2, "action|dialog_return\ndialog_name|rolequestconfirm\nbuttonClicked|startFarmerquest")
            sleep(500)
        elseif botFinishQuest then
            bot:sendPacket(2, "action|dialog_return\ndialog_name|rolequestspage\nbuttonClicked|completequest")
            sleep(500)
        end
    end
    removeEvent(Event.variantlist)
end

function updateConfig()
    local result, err = JSON:content(config)
    if not result then 
        botInfo(farming.webhook.info, "Error reading config: " .. (err or "unknown error"))
        return
    end

    queryInsert('[CONFIG] UPDATING CONFIG')
    farming = result

    -- Update bot settings
    bot.reconnect_interval = farming.interval.connect
    bot.legit_mode = farming.show_animation
    bot.move_interval = farming.move_interval
    bot.move_range = farming.move_range

    bot.disconnect_on_rest = farming.auto_rest.disconnect_rest
    bot.auto_rest_mode = farming.auto_rest.enable
    bot.rest_time = farming.auto_rest.duration
    bot.rest_interval = farming.auto_rest.interval
end

farming = JSON:content(config)

if farming then
    sleep(math.random(1, #getBots()) * 1000)

    queryInsert("[SCRIPT] INITIALIZING [1]")
    for i = math.floor(farming.tile_number / 2), 1, -1 do
        i = i * -1
        table.insert(tileBreak,i)
    end

    queryInsert("[SCRIPT] INITIALIZING [2]")
    for i = 0, math.ceil(farming.tile_number / 2) - 1 do
        table.insert(tileBreak,i)
    end

    queryInsert("[SCRIPT] INITIALIZING [3]")
    for _,item in pairs(farming.purchase.list) do
        table.insert(farming.whitelist, item)
    end

    queryInsert("[SCRIPT] INITIALIZING [4]")
    for ye = 1, 53 do
        local start, stop, step
        if ye % 4 == 1 then
            start, stop, step = 0, 99, 1
        else
            start, stop, step = 99, 0, -1
        end
        for ex = start, stop, step do
            table.insert(tilePath, {x = ex, y = ye})
        end
    end

    while bot.status ~= BotStatus.online do
        bot.auto_reconnect = true
        sleep(1000)
        if bot.google_status == 3 or bot.google_status == 7 then
            bot:connect()
            sleep(1000)
        end
        while bot.status == BotStatus.account_banned do
            bot.auto_reconnect = false
            bot:stopScript()
        end
    end
    
    if farming.pnb_home_world then
        queryInsert("Searching Tutorial")
        sleep(100)
        checkTutorial()
        sleep(100)
    end

    bot:setCountry('id')

    if bot.level < 40 then
        clearHistory(5)
    end

    while true do
        updateConfig()
        world, doorFarm = read(farming.world_list)

        if checkItemClothes() then
            takeClothes()
            sleep(100)
        end

        if bot.level < 40 then
            takeMagplant()
            sleep(100)
        end

        warp(world,doorFarm,true,true)
        sleep(100)

        if not nuked then
            patokanTree = math.floor(GROWSCAN:tile(farming.item_seed) / 2)
            queryInsert('Patokan tree di harvest: ' .. patokanTree)

            local scanTile = ScanWorld()

            if not scanTile.fire then
                local tt = os.time()
                if scanTile.toxic then
                    queryInsert("[FARMING] Cleaning Toxic Waste")
                    sleep(100)
                    bot.anti_toxic = true
                    while true do 
                        local cntToxic = 0
                        for _,tile in pairs(getTiles()) do
                            if tile.fg == 778 then
                                cntToxic = cntToxic + 1
                                sleep(100)
                            end
                        end
                        if cntToxic == 0 then
                            bot.anti_toxic = false
                            break
                        end
                        sleep(100)
                    end
                end
                if farming.event.enable and checkItemStorage() then
                    dropStorage(world)
                    sleep(100)
                end
                if findItem(98) >= 1 then
                    bot:trash(98, findItem(98))
                    sleep(500)
                end
                startRoleQuest()
                sleep(100)
                clearBlocks(world)
                sleep(100)
                harvest(world)
                sleep(100)
                clearBlocks(world)
                sleep(100)
                plant(world)
                sleep(100)
                tt = os.time() - tt
                sleep(100)
            else
                nukeWorldInfo(farming.webhook.world, string.format(
                    '[FARM] %s|%s is FIRED',
                    world, doorFarm
                ))
            end
        else
            if nuked then
                nukeWorldInfo(farming.webhook.world, string.format(
                    '[FARM] %s|%s is NUKED',
                    world, doorFarm
                ))
            end
        end
        if farming.random_world then
            clearHistory(5)
        end
        ::SKIP_WORLD::
    end
end