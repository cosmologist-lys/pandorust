// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use log::{error, info};
use pandorust_core::components::RpcResponse;
use project_cleanser::parts::{CleanResult, ProjectCleanserRespond};
use quick_find::QuickFindRespond;
use tauri_plugin_log::{Target, TargetKind, TimezoneStrategy};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let opener_plugin = tauri_plugin_opener::init();
    let tauri_log = tauri_plugin_log::Builder::new()
        .targets([
            Target::new(TargetKind::Stdout),
            Target::new(TargetKind::LogDir { file_name: None }),
            Target::new(TargetKind::Webview),
        ])
        .timezone_strategy(TimezoneStrategy::UseLocal)
        .level(log::LevelFilter::Debug)
        .build();
    tauri::Builder::default()
        .plugin(tauri_log)
        .plugin(opener_plugin)
        .invoke_handler(tauri::generate_handler![
            quick_find_search,
            scan_projects,
            remove_targets
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
async fn quick_find_search(
    root_path: String,
    glob_pattern: String,
) -> RpcResponse<QuickFindRespond> {
    info!(
        "quick-find:[search] , request values : root-path = {} , glob-pattern = {}",
        root_path, glob_pattern
    );
    let search_result =
        tokio::task::spawn_blocking(move || quick_find::search(&root_path, &glob_pattern))
            .await
            .unwrap(); // 处理 spawn_blocking 本身的错误
    match search_result {
        Ok(good) => {
            info!(
                "quick-find:[search] successfully , count = {} , spent-millis = {}",
                good.count, good.spent_millis
            );
            RpcResponse::ok(good)
        }
        Err(error) => {
            error!("quick-find:[search] failed , err = {}", error);
            RpcResponse::err(error)
        }
    }
}

#[tauri::command]
fn scan_projects(root_path: String, project_type: String) -> RpcResponse<ProjectCleanserRespond> {
    info!(
        "project-cleanser:[scan] , request values : root-path = {}, project-type = {}",
        root_path, project_type
    );
    let targets = project_cleanser::scan_projects(&root_path, &project_type);
    match targets {
        Ok(good) => {
            info!(
                "project-cleanser:[scan] successfully , count = {} , occupied = {} , spent-millis = {}",
                good.count,
                good.occupied,
                good.spent_millis
        );
            RpcResponse::ok(good)
        }
        Err(error) => {
            error!("project-cleanser:[scan] failed , err = {}", error);
            RpcResponse::err(error)
        }
    }
}

#[tauri::command]
fn remove_targets(targets: Vec<CleanResult>) -> RpcResponse<ProjectCleanserRespond> {
    info!(
        "project-cleanser:[clear] , request target size = {}",
        targets.len()
    );
    let targets = project_cleanser::remove_targets(targets);
    match targets {
        Ok(good) => {
            info!(
                "project-cleanser:[clear] successfully , count = {} , occupied = {} , spent-millis = {}",
                good.count,
                good.occupied,
                good.spent_millis
            );
            RpcResponse::ok(good)
        }
        Err(error) => {
            error!("project-cleanser:[clear] failed , err = {}", error);
            RpcResponse::err(error)
        }
    }
}
