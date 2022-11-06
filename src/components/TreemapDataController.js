import Treemap from "./Treemap";

function TreemapDataController({tree, screenSize, options, selectedOption, token, setSelectedOptionHandler, setSelectedOfficeHandler}) {
    return (
        <div>
            { tree != null ?
              <div id="treemap-box">
                    <div className="col-4 mx-2">
                        <select className="form-select my-2" onChange={e => setSelectedOptionHandler(e.target.value)}>
                            <option key={0} value='accuracy'>Точність прийому</option>
                            <option key={1} value='worktime'>Використання робочого часу</option>
                            {options.map((option, index) => <option key={index + 2} value={option}>{option}</option>)}
                        </select>
                    </div>
                    <Treemap width={screenSize[0]} height={screenSize[1]} data={tree} token={token} selectedOption={selectedOption}
                        setSelectedOfficeHandler={setSelectedOfficeHandler} />
              </div>
              : <h1>Завантаження даних...</h1>}
        </div>
    )
}

export default TreemapDataController;