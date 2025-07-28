use serde::{Deserialize, Serialize};
use std::fmt::Display;

#[derive(Debug, Clone)]
pub enum ProjectType {
    Cargo,
    Maven,
    Any,
}

#[derive(Debug, Clone)]
pub enum MavenTargetType {
    Target,
    Build,
}

impl ProjectType {
    pub fn tag(self: &Self) -> &'static str {
        match self {
            ProjectType::Cargo => "Cargo.toml",
            ProjectType::Maven => "pom.xml",
            _ => "",
        }
    }

    pub fn mapping(_type: &str) -> Self {
        match _type {
            "maven" => Self::Maven,
            "cargo" => Self::Cargo,
            _ => Self::Any,
        }
    }
}

impl Display for MavenTargetType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let str = match self {
            MavenTargetType::Target => String::from("target"),
            MavenTargetType::Build => String::from("build"),
        };
        write!(f, "{}", str)
    }
}

/// <modules> 标签, 它包含一个或多个 <module> 标签
#[derive(Debug, Deserialize, Default)]
pub struct MavenModule {
    #[serde(rename = "module", default)]
    pub module: Vec<String>,
}

/// 代表 pom.xml 的顶层结构 (<project> 标签)
/// 我们只关心 <modules> 部分
#[derive(Debug, Deserialize, Default)]
pub struct MavenPom {
    #[serde(default)]
    pub modules: MavenModule,
}

#[derive(Debug, Deserialize, Default, Clone, Serialize)]
pub struct CleanResult {
    pub path: String,
    pub occupied: String,
    pub size: u64,
    pub _type: String,
    pub updated_at: String,
}

// 扫描的返回
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct ProjectCleanserRespond {
    pub vec: Vec<CleanResult>,
    pub count: usize,
    pub occupied: String,
    pub total_size: u64,
    pub spent_millis: u128,
}
