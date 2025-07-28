use jwalk::rayon::iter::{IntoParallelIterator, ParallelIterator};
use std::fs;
use std::path::{Path, PathBuf};
use std::time::{Instant, SystemTime};
use chrono::{DateTime, Local};
use humansize::{format_size, DECIMAL};
use jwalk::WalkDir;
use jwalk::rayon::iter::IntoParallelRefIterator;
use quick_xml::de::from_str;
use pandorust_core::common_err;
use pandorust_core::custom_err::PanError;
use crate::parts::{CleanResult, MavenPom, ProjectCleanserRespond, ProjectType};

/// 主清理函数，负责接收前端选中的项目列表并执行删除。
/// 它返回一个 ProjectCleanserRespond，其中只包含成功删除的项目。
pub fn clean_junk(items_to_clean: Vec<CleanResult>) -> Result<ProjectCleanserRespond, PanError> {
    let start_time = Instant::now();

    // --- 并行删除选中的目录 ---
    let (successfully_cleaned, failed_to_clean): (Vec<CleanResult>, Vec<CleanResult>) = items_to_clean
        .into_par_iter() // 使用 Rayon 并行迭代
        .partition(|item| {
            match fs::remove_dir_all(&item.path) {
                Ok(_) => {
                    // 删除成功
                    true
                },
                Err(e) => {
                    // 删除失败，在后端打印日志，方便调试
                    eprintln!("Failed to delete directory [{}]: {}", item.path, e);
                    false
                }
            }
        });

    combine_respond(successfully_cleaned,start_time.elapsed().as_millis())
}

/// 主入口函数，负责编排整个扫描流程
pub fn scan_projects(root_path: &str, target_type: &str) -> Result<ProjectCleanserRespond, PanError> {
    let start_time = Instant::now();
    let project_type = ProjectType::mapping(target_type);

    // --- 阶段一: 并行发现所有项目清单文件 (Cargo.toml, pom.xml) ---
    let project_manifests: Vec<PathBuf> = WalkDir::new(root_path)
        .parallelism(jwalk::Parallelism::RayonNewPool(0)) // 使用所有可用核心
        .into_iter()
        .filter_map(Result::ok)
        .filter(|entry| {
            let file_name = entry.file_name().to_str().unwrap_or("");
            match project_type {
                ProjectType::Cargo => file_name == "Cargo.toml",
                ProjectType::Maven => file_name == "pom.xml",
                ProjectType::Any => file_name == "Cargo.toml" || file_name == "pom.xml",
            }
        })
        .map(|entry| entry.path())
        .collect();

    // --- 阶段二: 并行处理已发现的项目，查找并分析 "垃圾" 文件夹 ---
    let results: Vec<CleanResult> = project_manifests
        .par_iter()
        .flat_map(|manifest_path| {
            process_project(manifest_path).unwrap_or_else(|_err| {
                Vec::new()
            })
        })
        .collect();

    combine_respond(results,start_time.elapsed().as_millis())
}

// 组合返回对象
fn combine_respond(results: Vec<CleanResult>, spent_millis: u128) -> Result<ProjectCleanserRespond,PanError> {
    let count = results.len();
    // 计算总大小
    let total_size = results.par_iter()
        .map(|one| one.size)
        .sum();

    // 翻译成给人看的
    let occupied = format_size(total_size,DECIMAL);

    Ok(ProjectCleanserRespond {
        vec: results,
        count,
        occupied,
        total_size,
        spent_millis,
    })
}

/// 根据项目清单类型，分发给对应的处理函数
fn process_project(manifest_path: &Path) -> Result<Vec<CleanResult>, PanError> {
    let file_name = manifest_path.file_name().unwrap().to_str().unwrap();
    match file_name {
        "Cargo.toml" => process_cargo_project(manifest_path),
        "pom.xml" => process_maven_project(manifest_path),
        _ => Ok(Vec::new()),
    }
}

/// 处理 Cargo 项目 (最终修正版)
fn process_cargo_project(manifest_path: &Path) -> Result<Vec<CleanResult>, PanError> {
    let project_dir = manifest_path.parent().unwrap();
    let target_path = project_dir.join("target");
    if target_path.is_dir() {
        if let Some(result) = calculate_folder_metadata(&target_path, "Cargo") {
            // 如果找到了，就返回包含这一个结果的 Vec。
            return Ok(vec![result]);
        }
    }
    // 如果没找到，就返回一个空 Vec。
    Ok(Vec::new())
}

/// 处理 Maven 项目 (支持递归)
fn process_maven_project(manifest_path: &Path) -> Result<Vec<CleanResult>, PanError> {
    let mut found_results = Vec::new();
    let project_dir = manifest_path.parent().unwrap();

    // 1. 检查当前目录是否有 target 或 build 文件夹
    for dir_name in ["target", "build"] {
        let potential_junk = project_dir.join(dir_name);
        if potential_junk.is_dir() {
            if let Some(result) = calculate_folder_metadata(&potential_junk, "Maven") {
                found_results.push(result);
            }
        }
    }

    // 2. 解析 pom.xml，递归处理子模块
    let content = fs::read_to_string(manifest_path)?;

    let pom: MavenPom = from_str(&content).map_err(|e| common_err!("pom.xml解析失败 : {}", e))?;

    for module_name in pom.modules.module {
        let module_path = project_dir.join(module_name).join("pom.xml");
        if module_path.exists() {
            // 递归调用
            found_results.extend(process_maven_project(&module_path)?);
        }
    }

    Ok(found_results)
}

/// 计算文件夹元数据 (大小, 最后修改时间)
fn calculate_folder_metadata(path: &Path, project_type: &str) -> Option<CleanResult> {
    let mut total_size: u64 = 0;
    let mut last_modified: SystemTime = SystemTime::UNIX_EPOCH;

    // 使用新的 jwalk 实例来并行遍历文件夹内部，计算总大小
    for entry in WalkDir::new(path).into_iter().filter_map(Result::ok) {
        if entry.file_type().is_file() {
            if let Ok(metadata) = entry.metadata() {
                total_size += metadata.len();
                if let Ok(modified) = metadata.modified() {
                    if modified > last_modified {
                        last_modified = modified;
                    }
                }
            }
        }
    }

    if total_size > 0 {
        Some(CleanResult {
            path: path.to_string_lossy().to_string(),
            occupied: format_size(total_size, DECIMAL),
            size: total_size,
            _type: project_type.to_string(),
            updated_at: DateTime::<Local>::from(last_modified).format("%Y-%m-%d").to_string(),
        })
    } else {
        None
    }
}