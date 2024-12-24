local HttpServer = HttpServer.new()

HttpServer:setLogger(function(request, response)
    print(string.format("Method: %s, Path: %s, Status: %i", request.method, request.path, response.status))
end)

HttpServer:get("/bot/logs", function(request, response)
    response.headers["Access-Control-Allow-Origin"] = "*"  -- Allow all origins (use specific origin in production)
    response.headers["Access-Control-Allow-Methods"] = "GET"  -- Allow methods
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"  -- Allow headers

    local json = require("json")

    local botIndex = request:getParam("index")
    if not botIndex then
        response:setContent("Missing parameter: name.", "text/plain")
        return
    end

    local bot = getBot(tonumber(botIndex))
    if not bot then
        response:setContent(json.encode({status = false, message = "Bot not found!"}), "text/plain")
        return
    end

    local consoleLog = {}
    for _,message in pairs(bot:getConsole().contents) do
        table.insert(consoleLog, message)
    end

    local message = {
        status = true,
        logs = consoleLog 
    }

    response:setContent(json.encode(message), "application/json")
end)

HttpServer:get("/bot/get", function(request, response)
    response.headers["Access-Control-Allow-Origin"] = "*"  -- Allow all origins (use specific origin in production)
    response.headers["Access-Control-Allow-Methods"] = "GET"  -- Allow methods
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"  -- Allow headers

    local json = require("json")

    local function maladyStatus(malady)
        local maladyNaming = {
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
        return maladyNaming[malady] or "?"
    end

    local function getBotStatus(status)
        local statusNaming = {
            [BotStatus.offline] = "disconnected",
            [BotStatus.online] = "connected",
            [BotStatus.account_banned] = "account_banned",
            [BotStatus.location_banned] = "location_banned",
            [BotStatus.server_overload] = "server_overload",
            [BotStatus.too_many_login] = "too_many_login",
            [BotStatus.maintenance] = "maintenance",
            [BotStatus.version_update] = "version_update",
            [BotStatus.server_busy] = "server_busy",
            [BotStatus.error_connecting] = "error_connecting",
            [BotStatus.logon_fail] = "logon_fail",
            [BotStatus.http_block] = "http_block",
            [BotStatus.wrong_password] = "wrong_password",
            [BotStatus.advanced_account_protection] = "advanced_account_protection",
            [BotStatus.bad_name_length] = "bad_name_length",
            [BotStatus.invalid_account] = "invalid_account",
            [BotStatus.guest_limit] = "guest_limit",
            [BotStatus.changing_subserver] = "changing_subserver",
            [BotStatus.captcha_requested] = "captcha_requested",
            [BotStatus.mod_entered] = "mod_entered",
            [BotStatus.high_load] = "high_load",
            [BotStatus.bad_gateway] = "bad_gateway",
            [BotStatus.server_issue] = "server_issue",
            [BotStatus.retrieving_token] = "retrieving_token",
            [BotStatus.player_entered] = "player_entered",
            [BotStatus.getting_server_data] = "getting_server_data",
            [BotStatus.bypassing_server_data] = "bypassing_server_data",
        }
        return statusNaming[status] or "unknown"
    end

    local function getGoogleStatus(googleStatus)
        local enum_status = {
            [GoogleStatus.idle] = "idle",
            [GoogleStatus.processing] = "processing",
            [GoogleStatus.init_error] = "init_error",
            [GoogleStatus.invalid_credentials] = "invalid_credentials",
            [GoogleStatus.invalid_challenge] = "invalid_challenge",
            [GoogleStatus.account_disabled] = "account_disabled",
            [GoogleStatus.captcha_required] = "captcha_required",
            [GoogleStatus.phone_required] = "phone_required",
            [GoogleStatus.recovery_required] = "recovery_required",
            [GoogleStatus.couldnt_verify] = "couldnt_verify",
            [GoogleStatus.unknown_url] = "unknown_url",
            [GoogleStatus.bad_server] = "bad_server",
            [GoogleStatus.bad_connection] = "bad_connection",
            [GoogleStatus.invalid_key] = "invalid_key",
            [GoogleStatus.missing_server] = "missing_server",
            [GoogleStatus.missing_local_server] = "missing_local_server",
            [GoogleStatus.timeout] = "timeout",
            [GoogleStatus.driver_closed] = "driver_closed",
            [GoogleStatus.redirect] = "redirect",
        }
        return enum_status[googleStatus] or "UNKNOWN"
    end

    local bots = getBots()
    local botList = {}

    for i, bot in ipairs(bots) do
        local botData = getBot(bot.name)

        local botInventory = {}
        for _, item in ipairs(bot:getInventory():getItems()) do
            local itemInfo = getInfo(item.id)
            if itemInfo then
                table.insert(botInventory, {
                    name = itemInfo.name,
                    id = item.id,
                    is_clothes = itemInfo.clothing_type ~= 0,
                    amount = item.count
                })
            end
        end

        local consoleLog = {}
        for _,message in pairs(bot:getConsole().contents) do
            table.insert(consoleLog, message)
        end

        table.insert(botList, {
            details = {
                index = i,
                name = bot.name,
                level = bot.level,
                ping = bot:getPing(),
                status = getBotStatus(bot.status),
                google_status = getGoogleStatus(bot.google_status),
                task = bot.custom_status or "",
                proxy = bot:getProxy().ip .. ':' .. bot:getProxy().port,
                world = bot:getWorld().name or "N/A",
                malady = maladyStatus(bot.malady),
                malady_expiration = bot:getMaladyDuration(),
                position = bot.x .. ':' .. bot.y,
                gems = bot.gem_count,
                obtained_gems = bot.obtained_gem_count or 0,
                playtime = math.ceil(bot:getPlaytime() / 3600),
                online_time = bot:getActiveTime(),
                age = bot:getAge(),
                is_resting = bot:isResting(),
                is_script_run = bot:isRunningScript(),
                is_account_secured = bot.is_account_secured,
                mac = bot:getLogin().mac,
                rid = bot:getLogin().rid,
                mail = bot:getLogin().mail,
                inventory = botInventory,
                console = consoleLog
            },
            index = i,
        })
    end

    -- Send the response as JSON
    response:setContent(json.encode(botList), "application/json")
end)

HttpServer:post("/bot/runScript", function(request, response)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "POST"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"

    local script = request.body

    local func, err = load(script, "runScript")
    if not func then
        response:setContent("Failed to load script:\n" .. tostring(err), "text/plain")
        return
    end

    local success, result = pcall(func)
    if success then
        response:setContent(tostring(result), "text/plain")
    else
        response:setContent(tostring(result), "text/plain")
    end
end)

HttpServer:get("/bot/config", function(request, response)
    response.headers["Access-Control-Allow-Origin"] = "*"  -- Allow all origins (use specific origin in production)
    response.headers["Access-Control-Allow-Methods"] = "GET"  -- Allow methods
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"  -- Allow headers

    local configData = read("C:\\Users\\Administrator\\Desktop\\config.json")  -- Use the inbuilt read function to get the file contents
  
    if configData then
        response:setContent(configData, "application/json")  -- Respond with JSON content
    else
        response:setContent("config.json not found.", "text/plain")
    end
end)

HttpServer:post("/bot/config", function(request, response)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "POST"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"

    local body = request.body -- Get the request body

    -- Validate and write the JSON data to the config file
    local success = write("C:\\Users\\Administrator\\Desktop\\config.json", body) -- Assuming write is a function you have to write data to a file

    if success then
        response:setContent("Config updated successfully.", "text/plain")
    else
        response:setContent("Failed to update config.", "text/plain")
    end
end)

HttpServer:get("/bot/farm", function(request, response)
    response.headers["Access-Control-Allow-Origin"] = "*"  -- Allow all origins (use specific origin in production)
    response.headers["Access-Control-Allow-Methods"] = "GET"  -- Allow methods
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"  -- Allow headers

    local configData = read("C:\\Users\\Administrator\\Desktop\\FARM.json")  -- Use the inbuilt read function to get the file contents
  
    if configData then
        response:setContent(configData, "application/json")  -- Respond with JSON content
    else
        response:setContent("config.json not found.", "text/plain")
    end
end)

HttpServer:post("/bot/farm", function(request, response)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "POST"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"

    local body = request.body -- Get the request body

    -- Validate and write the JSON data to the config file
    local success = write("C:\\Users\\Administrator\\Desktop\\FARM.json", body) -- Assuming write is a function you have to write data to a file

    if success then
        response:setContent("Farm updated successfully.", "text/plain")
    else
        response:setContent("Failed to update config.", "text/plain")
    end
end)

HttpServer:post("/bot/remove", function(request, response)
    -- Set CORS headers
    response:setHeader("Access-Control-Allow-Origin", "*")  -- Allow all origins (use specific origin in production)
    response:setHeader("Access-Control-Allow-Methods", "POST")  -- Allow methods
    response:setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")  -- Allow headers

    -- Get the name parameter from the request
    local name = request:getParam("name")

    -- Validate the name parameter
    if not name then
        response:setContent("Missing parameter: name.", "text/plain")
        return
    end

    -- Check if the bot exists before removing it
    local bot = getBot(name)
    if not bot then
        response:setContent("Bot not found.", "text/plain")
        return
    end

    -- Attempt to remove the bot
    local success, err = pcall(function()
        removeBot(name)
    end)

    if not success then
        response:setContent("Error removing bot: " .. err, "text/plain")
        return
    end

    response:setContent("You have successfully removed bot " .. name .. ".", "text/plain")
end)

HttpServer:post("/bot/add", function(request, response)
    response.headers["Access-Control-Allow-Origin"] = "*"  -- Allow all origins (use specific origin in production)
    response.headers["Access-Control-Allow-Methods"] = "POST"  -- Allow methods
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"  -- Allow headers

    local json = require("json")

    -- Try to retrieve bot information from query parameters
    local botInfo = {
        name = request:getParam("name"),
        password = request:getParam("password"),
        recovery = request:getParam("recovery") or "", -- optional
        mac = request:getParam("mac") or "", -- optional
        rid = request:getParam("rid") or "", -- optional
        proxy = request:getParam("proxy") or "",       -- optional
        platform = Platform.windows -- default to windows if not provided
    }

    -- Check if the required fields are present
    if botInfo.name and botInfo.password then
        local success = addBot(botInfo)
        if success then
            success.reconnect_on_unknown_url = true
            success:getConsole().enabled = true
            
            response:setContent("Bot has been added.", "text/plain")
        else
            response:setContent("Failed to add bot.", "text/plain")
        end
    else
        response:setContent("Invalid input, missing required fields.", "text/plain")
    end
end)

HttpServer:get("/bot/bot-backup", function(request, response)
    response.headers["Access-Control-Allow-Origin"] = "*"  -- Allow all origins (use specific origin in production)
    response.headers["Access-Control-Allow-Methods"] = "GET"  -- Allow methods
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"  -- Allow headers

    local backupData = read("C:\\Users\\Administrator\\Desktop\\bot-backup.json")  -- Adjust the path if necessary
    if backupData then
        response:setContent(backupData, "application/json")
    else
        response:setContent("Failed to read backup data.", "text/plain")
    end
end)

HttpServer:post("/bot/bot-backup", function(request, response)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "POST"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"

    local body = request.body -- Get the request body

    -- Validate and write the JSON data to the config file
    local success = write("C:\\Users\\Administrator\\Desktop\\bot-backup.json", body) -- Assuming write is a function you have to write data to a file

    if success then
        response:setContent("Backup updated successfully.", "text/plain")
    else
        response:setContent("Failed to update Backup.", "text/plain")
    end
end)

HttpServer:get("/bot/rotasi-script", function(request, response)
    response.headers["Access-Control-Allow-Origin"] = "*"  -- Allow all origins (use specific origin in production)
    response.headers["Access-Control-Allow-Methods"] = "GET"  -- Allow methods
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"  -- Allow headers

    local backupData = read("C:\\Users\\Administrator\\Desktop\\rotasi-luci-json.lua")  -- Adjust the path if necessary
    if backupData then
        response:setContent(backupData, "text/plain")
    else
        response:setContent("Failed to read backup data.", "text/plain")
    end
end)

HttpServer:post("/bot/rotasi-script", function(request, response)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "POST"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"

    local body = request.body -- Get the request body

    -- Validate and write the JSON data to the config file
    local success = write("C:\\Users\\Administrator\\Desktop\\rotasi-luci-json.lua", body) -- Assuming write is a function you have to write data to a file

    if success then
        response:setContent("Backup updated successfully.", "text/plain")
    else
        response:setContent("Failed to update Backup.", "text/plain")
    end
end)

HttpServer:listen("0.0.0.0", 8443)