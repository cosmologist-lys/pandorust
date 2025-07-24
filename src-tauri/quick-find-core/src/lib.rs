use glob::Pattern;
use pandorust_core::common_err;
use pandorust_core::custom_err::PanError;
use rayon::prelude::*;
use std::path::PathBuf;
use std::time::Instant;
use walkdir::WalkDir;
use serde::{Deserialize, Serialize};

#[derive(Debug,Clone,Deserialize,Serialize)]
pub struct QuickFindRespond {
    pub vec: Vec<String>,
    pub count: u16,
    pub spent_millis: u128,
}

pub fn search(root_path: &str, glob_patter: &str) -> Result<QuickFindRespond, PanError> {
    let start_time = Instant::now();
    let input = glob_patter.trim();
    // 1. 判断输入是否包含glob通配符
    let is_glob_search = input.contains('*') || input.contains('?') || input.contains('[');
    let walker = WalkDir::new(root_path.trim()).follow_links(false);
    // 根据是否为glob搜索，采取不同的过滤逻辑
    let search_result: Vec<PathBuf> = if is_glob_search {
        let pattern = match Pattern::new(input){
            Ok(p) => p,
            Err(e) => return Err(common_err!("无效的 glob 模式: {}", e)),
        };
        walker
            .into_iter()
            .filter_map(Result::ok)
            .par_bridge()
            .filter(move |entry| {
                entry.file_name()
                    .to_str()
                    .map(|s| pattern.matches(s))
                    .unwrap_or(false)
            })
            .map(|entry| entry.into_path())
            .collect()
    } else {
        let exact_name = std::ffi::OsStr::new(input);
        walker
            .into_iter()
            .filter_map(Result::ok)
            .par_bridge()
            .filter(move |entry| entry.file_name() == exact_name)
            .map(|entry| entry.into_path())
            .collect()
    };
    // 4. 从结果中获取文件数量
    let count = search_result.len();
    // 5. 计算总耗时
    let elapsed = start_time.elapsed();
    let spent_seconds = elapsed.as_millis();

    // 6. 构建 QuickFindRespond 结构体并返回
    Ok(QuickFindRespond {
        vec: search_result.into_iter().map(|s| s.to_string_lossy().into_owned()).collect(),
        count: count as u16, // 注意这里的类型转换
        spent_millis: spent_seconds,
    })
}

