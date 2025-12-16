# Publishing Olostep MCP Server to Docker's Official MCP Registry

## 🎯 Goal
Make the Olostep MCP Server available to **all Docker users** through:
1. Docker Hub's MCP namespace (`mcp/olostep`)
2. Docker Desktop's MCP Toolkit (appears in the UI for easy installation)
3. Official MCP Catalog (https://hub.docker.com/mcp)

## ✅ Current Status

**Good news**: The Olostep MCP server entry already exists in the Docker MCP Registry fork at:
- `docker-mcp-registry-fork/servers/olostep/`

This means the groundwork is done. Now we need to:
1. Ensure the Docker image is published to Docker Hub
2. Submit/update the entry in Docker's official registry
3. Test it through Docker Desktop's MCP Toolkit

---

## 📦 Step 1: Publish Docker Image to Docker Hub

### Option A: Docker Builds It (Recommended - Enhanced Security)
**Benefits**: Cryptographic signatures, provenance tracking, SBOMs, automatic security updates

When you submit to the official Docker MCP Registry **without** providing your own image, Docker will:
- Build the image from your GitHub repo's Dockerfile
- Sign it cryptographically
- Host it at `mcp/olostep` on Docker Hub
- Provide automatic security updates

**Requirements**:
- Public GitHub repository: ✅ `https://github.com/olostep/olostep-mcp-server`
- Dockerfile in root: ✅ Already exists
- No additional work needed!

### Option B: Self-Published Image
If you want to control the image yourself:

```bash
# 1. Build and tag the image
cd olostep-mcp-server
docker build -t olostep/mcp-server:latest -t olostep/mcp-server:v1.0.9 .

# 2. Login to Docker Hub
docker login

# 3. Push to Docker Hub
docker push olostep/mcp-server:latest
docker push olostep/mcp-server:v1.0.9
```

Then update `servers/olostep/server.yaml`:
```yaml
image: olostep/mcp-server:latest  # Instead of mcp/olostep
```

---

## 🔄 Step 2: Submit to Docker's Official MCP Registry

### Current Entry Status
The entry exists in your fork: `docker-mcp-registry-fork/servers/olostep/`

**Files present**:
- ✅ `server.yaml` - Server configuration
- ✅ `tools.json` - Tool definitions (241 lines)

### Submission Process

#### 1. Ensure Entry is Complete

Check `servers/olostep/server.yaml`:
```yaml
name: olostep
image: mcp/olostep  # Docker will build this
type: server
meta:
  category: search
  tags:
    - web-scraping
    - search
    - data-extraction
    - ai-tools
about:
  title: Olostep
  description: Search the web, extract data from websites as markdown, and discover URLs for site structure analysis
  icon: https://avatars.githubusercontent.com/u/182288589?s=200&v=4
source:
  project: https://github.com/olostep/olostep-mcp-server
config:
  description: Configure your Olostep API credentials
  secrets:
    - name: olostep.api_key
      env: OLOSTEP_API_KEY
      example: YOUR_OLOSTEP_API_KEY
      description: Get your free API key from [Olostep](https://olostep.com/auth)
```

#### 2. Validate Locally

```bash
cd docker-mcp-registry-fork

# Validate the server definition
task validate -- --name olostep

# Build and verify tools
task build -- --tools olostep

# Test in local catalog
task catalog -- olostep
docker mcp catalog import $PWD/catalogs/olostep/catalog.yaml
```

#### 3. Create Pull Request to Official Docker MCP Registry

**Target Repository**: `https://github.com/docker/mcp-registry` (official, not your fork)

**PR Title**: `Add Olostep MCP Server`

**PR Description** (use template from `.github/PULL_REQUEST_TEMPLATE.md`):
```markdown
## What does this PR do?
Adds the Olostep MCP Server to the official Docker MCP Registry.

## Server Type
- [x] Local Server (containerized)
- [ ] Remote Server (hosted)

## Server Details
- **Name**: olostep
- **Category**: search
- **GitHub**: https://github.com/olostep/olostep-mcp-server
- **Image**: mcp/olostep (Docker-built)
- **License**: ISC

## Features
- Web scraping (HTML, Markdown, JSON, Text)
- AI-powered search answers with citations
- Batch processing (up to 10k URLs)
- Autonomous site crawling
- Website URL discovery and mapping

## Testing
- [x] Validated locally with `task validate`
- [x] Built and tested tools with `task build --tools`
- [x] Tested in local Docker Desktop MCP Toolkit
- [x] Verified with API key on real endpoints

## Configuration
Requires `OLOSTEP_API_KEY` secret - users can get a free key from https://olostep.com/auth

## Checklist
- [x] Server has Dockerfile
- [x] License allows public consumption (ISC)
- [x] All tools documented in tools.json
- [x] Icon URL is valid
- [x] Passes local validation
- [x] Tested end-to-end
```

#### 4. Share Test Credentials
Docker team will need to test your server. Fill out: https://forms.gle/6Lw3nsvu2d6nFg8e6

Provide:
- A test `OLOSTEP_API_KEY`
- Server name: `olostep`
- Example test queries they can run

---

## 🚀 Step 3: Once Approved - Automatic Availability

After Docker team approves and merges your PR:

### Automatic within 24 hours:
1. **Docker Desktop MCP Toolkit**
   - Users open Docker Desktop
   - Navigate to MCP Toolkit
   - Search for "Olostep"
   - Click to install and configure

2. **Docker Hub MCP Namespace**
   - Image available at: `https://hub.docker.com/r/mcp/olostep`
   - Pulls work: `docker pull mcp/olostep`

3. **Official MCP Catalog**
   - Listed at: `https://hub.docker.com/mcp`
   - Discoverable by category (search)

---

## 📋 For End Users: How to Use Olostep MCP Server

Once published, users can install it in multiple ways:

### Method 1: Docker Desktop MCP Toolkit (Easiest)
1. Open Docker Desktop
2. Go to MCP Toolkit
3. Search "Olostep"
4. Click "Add"
5. Configure API key in the UI
6. Enable for their AI client (Claude Desktop, Cursor, etc.)

### Method 2: Direct Docker Run
```bash
docker run -i --rm \\
  -e OLOSTEP_API_KEY="your-key" \\
  mcp/olostep
```

### Method 3: Claude Desktop Config
Add to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "olostep": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "OLOSTEP_API_KEY=YOUR_API_KEY",
        "mcp/olostep"
      ]
    }
  }
}
```

### Method 4: Cursor Config
- Name: `olostep`
- Type: `command`
- Command: `docker run -i --rm -e OLOSTEP_API_KEY=your-key mcp/olostep`

---

## 🔍 Monitoring & Updates

### After Publication
- Monitor Docker Hub for pull statistics: `https://hub.docker.com/r/mcp/olostep`
- Watch GitHub issues for user feedback
- Docker handles automatic security updates (if Docker-built image)

### Updating the Server
When you release new versions:
1. Push changes to GitHub main branch
2. Update `servers/olostep/server.yaml` in docker/mcp-registry if needed
3. Create new PR with updates
4. Docker rebuilds the image automatically

---

## ✨ Benefits of Official Docker MCP Registry

1. **Discoverability**: Millions of Docker users can find your server
2. **Trust**: Docker's cryptographic signatures and SBOMs
3. **Easy Installation**: One-click install in Docker Desktop
4. **Security**: Automatic vulnerability scanning and updates
5. **Container Isolation**: Users' systems are protected
6. **Professional Distribution**: Official Docker Hub hosting

---

## 📞 Support & Questions

- **Docker MCP Registry Issues**: https://github.com/docker/mcp-registry/issues
- **Olostep MCP Server Issues**: https://github.com/olostep/olostep-mcp-server/issues
- **Docker Team Contact**: Share test credentials via https://forms.gle/6Lw3nsvu2d6nFg8e6

---

## 🎉 Next Steps

1. **Immediate**: Validate and test locally (see Step 2.2)
2. **Short-term**: Create PR to official docker/mcp-registry repo (see Step 2.3)
3. **After approval**: Announce to users that Olostep is available in Docker Desktop!

**Timeline**: Typically 24-48 hours from PR approval to live availability.
